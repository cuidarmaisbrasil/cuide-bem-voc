// Recebe batches de eventos de telemetria (Fase 1) e persiste sessão + eventos.
// Ao receber mode="submit", calcula authenticity_score básico por regras.
//
// Não bloqueia envios do respondente: falhas retornam 200 com {stored:false}
// para o cliente não interromper a coleta principal.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EventIn = {
  instrument?: string;
  item_index?: number | null;
  event_type: string;
  t_ms: number;
  value?: unknown;
  meta?: Record<string, unknown>;
};

type BodyIn = {
  session_token: string;
  mode?: "init" | "flush" | "submit";
  instrument?: string | null;
  company_id?: string | null;
  round_no?: number | null;
  device?: {
    fingerprint_hash?: string;
    user_agent?: string;
    device_type?: string;
    os_name?: string;
    browser_name?: string;
    viewport_w?: number;
    viewport_h?: number;
    dpr?: number;
    screen_w?: number;
    screen_h?: number;
    timezone?: string;
    locale?: string;
  };
  events?: EventIn[];
};

const ALLOWED_EVENT_TYPES = new Set([
  "view", "first_touch", "change", "submit", "blur", "focus",
  "paste", "scroll", "start", "end",
]);

async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get("TELEMETRY_IP_SALT") ?? "cuidar-mais-telemetry-v1";
  const data = new TextEncoder().encode(salt + ":" + ip);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function computeScore(events: EventIn[]) {
  const changes = events.filter((e) => e.event_type === "change");
  const values = changes
    .map((e) => (typeof e.value === "number" ? e.value : null))
    .filter((v): v is number => v !== null);

  // tempos por item (t entre 'view' anterior e 'change')
  const timesByItem = new Map<number, number>();
  const viewT = new Map<number, number>();
  for (const e of events) {
    if (e.item_index == null) continue;
    if (e.event_type === "view") viewT.set(e.item_index, e.t_ms);
    if (e.event_type === "change") {
      const vt = viewT.get(e.item_index);
      if (vt != null) timesByItem.set(e.item_index, e.t_ms - vt);
    }
  }
  const times = [...timesByItem.values()].filter((t) => t >= 0 && t < 600000);

  const medT = median(times);
  const fastCount = times.filter((t) => t < 800).length;
  const fastRatio = times.length ? fastCount / times.length : 0;

  const uniqueVals = new Set(values);
  const straightlining = values.length >= 5 && uniqueVals.size === 1;

  const hadPaste = events.some((e) => e.event_type === "paste");
  const blurCount = events.filter((e) => e.event_type === "blur").length;

  const totalT = events.length
    ? Math.max(...events.map((e) => e.t_ms))
    : 0;

  // score simples: começa em 1.0 e subtrai por red flags
  let score = 1.0;
  const reasons: string[] = [];
  if (straightlining) { score -= 0.4; reasons.push("straightlining"); }
  if (hadPaste) { score -= 0.25; reasons.push("paste_event"); }
  if (fastRatio > 0.5) { score -= 0.25; reasons.push("too_fast_responses"); }
  if (medT != null && medT < 500) { score -= 0.15; reasons.push("median_under_500ms"); }
  if (blurCount > 10) { score -= 0.1; reasons.push("many_blur_events"); }
  if (totalT > 0 && totalT < 30000 && values.length >= 9) {
    score -= 0.15; reasons.push("total_under_30s");
  }

  score = Math.max(0, Math.min(1, score));
  const flag = score < 0.4 ? "reject" : score < 0.7 ? "suspect" : "ok";

  return {
    authenticity_score: Number(score.toFixed(3)),
    flag,
    n_items: values.length,
    median_time_ms: medT,
    total_time_ms: totalT,
    straightlining,
    had_paste: hadPaste,
    blur_count: blurCount,
    fast_ratio: Number(fastRatio.toFixed(3)),
    signals: { reasons, times_count: times.length },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    const body = (await req.json().catch(() => null)) as BodyIn | null;
    if (!body?.session_token) return respond({ stored: false, error: "missing_token" }, 200);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "0.0.0.0";
    const ip_hash = await hashIp(ip);

    // get-or-create session
    const { data: existing } = await sb
      .from("telemetry_sessions")
      .select("id")
      .eq("session_token", body.session_token)
      .maybeSingle();

    let sessionId: string;
    if (existing?.id) {
      sessionId = existing.id;
      await sb
        .from("telemetry_sessions")
        .update({
          last_flush_at: new Date().toISOString(),
          flush_count: undefined, // handled via increment below with rpc alt; keep simple
          instrument: body.instrument ?? undefined,
          company_id: body.company_id ?? undefined,
          round_no: body.round_no ?? undefined,
          submitted_at: body.mode === "submit" ? new Date().toISOString() : undefined,
        })
        .eq("id", sessionId);
    } else {
      const d = body.device ?? {};
      const { data: inserted, error: insErr } = await sb
        .from("telemetry_sessions")
        .insert({
          session_token: body.session_token,
          company_id: body.company_id ?? null,
          round_no: body.round_no ?? null,
          instrument: body.instrument ?? null,
          fingerprint_hash: d.fingerprint_hash ?? null,
          user_agent: d.user_agent ?? null,
          device_type: d.device_type ?? null,
          os_name: d.os_name ?? null,
          browser_name: d.browser_name ?? null,
          viewport_w: d.viewport_w ?? null,
          viewport_h: d.viewport_h ?? null,
          dpr: d.dpr ?? null,
          screen_w: d.screen_w ?? null,
          screen_h: d.screen_h ?? null,
          timezone: d.timezone ?? null,
          locale: d.locale ?? null,
          ip_hash,
          last_flush_at: new Date().toISOString(),
          flush_count: 1,
          submitted_at: body.mode === "submit" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();
      if (insErr || !inserted) return respond({ stored: false, error: insErr?.message }, 200);
      sessionId = inserted.id;
    }

    // events
    const events = Array.isArray(body.events) ? body.events : [];
    const rows = events
      .filter((e) => e && ALLOWED_EVENT_TYPES.has(e.event_type) && typeof e.t_ms === "number")
      .slice(0, 500) // cap por request
      .map((e) => ({
        session_id: sessionId,
        instrument: e.instrument ?? body.instrument ?? null,
        item_index: e.item_index ?? null,
        event_type: e.event_type,
        t_ms: Math.max(0, Math.min(24 * 3600 * 1000, Math.floor(e.t_ms))),
        value: e.value === undefined ? null : e.value,
        meta: e.meta ?? null,
      }));

    if (rows.length) {
      await sb.from("telemetry_events").insert(rows);
    }

    // score no submit
    if (body.mode === "submit" && body.instrument) {
      // pega TODOS os eventos daquela sessão+instrumento para o score
      const { data: allEvents } = await sb
        .from("telemetry_events")
        .select("event_type,item_index,t_ms,value")
        .eq("session_id", sessionId)
        .eq("instrument", body.instrument);

      const score = computeScore((allEvents ?? []) as EventIn[]);
      await sb
        .from("telemetry_scores")
        .delete()
        .eq("session_id", sessionId)
        .eq("instrument", body.instrument);
      await sb.from("telemetry_scores").insert({
        session_id: sessionId,
        instrument: body.instrument,
        ...score,
      });
    }

    return respond({ stored: true, session_id: sessionId, count: rows.length });
  } catch (e) {
    console.error("[telemetry-ingest]", e);
    return respond({ stored: false, error: String((e as Error)?.message ?? e) }, 200);
  }
});
