// Edge function: receives a tracking event, hashes the IP, resolves geolocation
// from request headers, and inserts into test_events or link_clicks.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

function getGeo(req: Request) {
  return {
    country: req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null,
    region: req.headers.get("cf-region") || req.headers.get("x-vercel-ip-country-region") || null,
    city: req.headers.get("cf-ipcity") || req.headers.get("x-vercel-ip-city") || null,
  };
}

async function logQuotaAlert(supabase: ReturnType<typeof createClient>, message: string) {
  try {
    await supabase.from("system_alerts").insert({
      alert_type: "quota",
      severity: "critical",
      message,
    });
  } catch (_) { /* swallow */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const { type, payload } = body || {};

    if (!type || !payload) {
      return new Response(JSON.stringify({ error: "Missing type or payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = getClientIp(req);
    const ipHash = await sha256(ip + ":" + (Deno.env.get("SUPABASE_PROJECT_ID") || "salt"));
    const geo = getGeo(req);
    const ua = req.headers.get("user-agent") || "";

    let result;
    if (type === "test") {
      const ageRaw = payload.age;
      const age =
        typeof ageRaw === "number" && Number.isFinite(ageRaw) && ageRaw >= 1 && ageRaw <= 120
          ? Math.floor(ageRaw)
          : null;
      const symptomsRaw = payload.symptoms;
      const symptoms = Array.isArray(symptomsRaw)
        ? symptomsRaw.filter((s: unknown) => typeof s === "string" && s.length <= 64).slice(0, 30)
        : null;
      result = await supabase.from("test_events").insert({
        score: payload.score ?? null,
        severity: payload.severity ?? null,
        age,
        symptoms,
        ip_hash: ipHash,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        user_agent: ua.slice(0, 500),
      });
    } else if (type === "click") {
      result = await supabase.from("link_clicks").insert({
        link_type: payload.link_type,
        target_id: payload.target_id ?? null,
        target_label: payload.target_label ?? null,
        ip_hash: ipHash,
        country: geo.country,
        region: geo.region,
        city: geo.city,
      });
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (result.error) {
      const msg = result.error.message?.toLowerCase() || "";
      if (msg.includes("quota") || msg.includes("insufficient") || msg.includes("limit")) {
        await logQuotaAlert(supabase, `Possível limite atingido: ${result.error.message}`);
      }
      throw result.error;
    }

    // Volume threshold check (every ~100th call)
    if (Math.random() < 0.01) {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { count } = await supabase
        .from("test_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since.toISOString());
      if (count && count > 10000) {
        await supabase.from("system_alerts").insert({
          alert_type: "volume",
          severity: "warning",
          message: `Volume mensal alto: ${count} testes em 30 dias. Considere monitorar saldo do Lovable Cloud.`,
          metadata: { count },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("track-event error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
