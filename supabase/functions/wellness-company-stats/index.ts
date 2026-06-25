import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type WaveKey = "phq9" | "ecig" | "copsoq" | "psicossocial" | "assedio_sexual";
const WAVES: WaveKey[] = ["phq9", "ecig", "copsoq", "psicossocial", "assedio_sexual"];
const DEFAULT_MIN_RECORTE = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return j({ error: "unauthorized" }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");

    const u = new URL(req.url);
    const company_id = u.searchParams.get("company_id");
    const period = u.searchParams.get("period") || "all"; // '30d' | 'all'
    if (!company_id) return j({ error: "bad_request" }, 400);

    if (!isAdmin) {
      const { data: co } = await admin.from("companies").select("owner_user_id").eq("id", company_id).maybeSingle();
      if (!co || co.owner_user_id !== user.id) return j({ error: "forbidden" }, 403);
    }

    // Per-company min_recorte (privacy threshold), with global fallback
    const { data: cfgRow } = await admin
      .from("wellness_company_settings")
      .select("min_recorte_company")
      .eq("company_id", company_id)
      .maybeSingle();
    const MIN_RECORTE = cfgRow?.min_recorte_company ?? DEFAULT_MIN_RECORTE;



    // ---------- Legacy aggregate summary (kept for backwards compatibility) ----------
    let q = admin
      .from("wellness_invitations")
      .select("wave,status,scheduled_at,sent_at,completed_at,round_no, wellness_participants!inner(company_id)")
      .eq("wellness_participants.company_id", company_id);
    if (period === "30d") {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      q = q.gte("scheduled_at", since);
    }
    const { data: invs } = await q;

    const summary: Record<string, { scheduled: number; sent: number; completed: number }> = {
      phq9: { scheduled: 0, sent: 0, completed: 0 },
      ecig: { scheduled: 0, sent: 0, completed: 0 },
      copsoq: { scheduled: 0, sent: 0, completed: 0 },
      psicossocial: { scheduled: 0, sent: 0, completed: 0 },
      assedio_sexual: { scheduled: 0, sent: 0, completed: 0 },
    };
    (invs ?? []).forEach((i: any) => {
      const s = summary[i.wave];
      if (!s) return;
      s.scheduled++;
      if (i.sent_at) s.sent++;
      if (i.status === "completed") s.completed++;
    });

    // ---------- Rounds: per-round wave counts + COPSOQ scale aggregates ----------
    const { data: rounds } = await admin
      .from("wellness_company_rounds")
      .select("round_no, opened_at, closed_at, devolutiva_communicated_at, devolutiva_notes")
      .eq("company_id", company_id)
      .order("round_no", { ascending: true });

    const roundList = rounds ?? [];

    // Per-round wave counts (from ALL invitations, not filtered by period)
    const perRoundCounts: Record<number, Record<WaveKey, { scheduled: number; sent: number; completed: number }>> = {};
    const { data: allInvs } = await admin
      .from("wellness_invitations")
      .select("wave,status,sent_at,round_no, wellness_participants!inner(company_id)")
      .eq("wellness_participants.company_id", company_id);
    (allInvs ?? []).forEach((i: any) => {
      const r = i.round_no ?? 1;
      perRoundCounts[r] = perRoundCounts[r] || {
        phq9: { scheduled: 0, sent: 0, completed: 0 },
        ecig: { scheduled: 0, sent: 0, completed: 0 },
        copsoq: { scheduled: 0, sent: 0, completed: 0 },
        psicossocial: { scheduled: 0, sent: 0, completed: 0 },
      assedio_sexual: { scheduled: 0, sent: 0, completed: 0 },
      };
      const w = perRoundCounts[r][i.wave as WaveKey];
      if (!w) return;
      w.scheduled++;
      if (i.sent_at) w.sent++;
      if (i.status === "completed") w.completed++;
    });

    // COPSOQ scale aggregates per round (mean of per-respondent scale means)
    const { data: copsoqRows } = await admin
      .from("copsoq_responses")
      .select("round_no,scores,department,age_range")
      .eq("company_id", company_id);

    const copsoqPerRound: Record<number, {
      n_total: number;
      scales: Record<string, { sum: number; count: number }>;
    }> = {};
    (copsoqRows ?? []).forEach((row: any) => {
      const r = row.round_no ?? 1;
      const bucket = copsoqPerRound[r] = copsoqPerRound[r] || { n_total: 0, scales: {} };
      bucket.n_total++;
      const scores = row.scores || {};
      for (const [scaleId, mean] of Object.entries(scores)) {
        if (typeof mean !== "number" || !isFinite(mean)) continue;
        const acc = bucket.scales[scaleId] = bucket.scales[scaleId] || { sum: 0, count: 0 };
        acc.sum += mean;
        acc.count++;
      }
    });

    // PHQ-9 severity distribution per round
    const { data: phqRows } = await admin
      .from("phq9_company_responses")
      .select("round_no,severity")
      .eq("company_id", company_id);
    const phqPerRound: Record<number, { n: number; dist: Record<string, number> }> = {};
    (phqRows ?? []).forEach((row: any) => {
      const r = row.round_no ?? 1;
      const b = phqPerRound[r] = phqPerRound[r] || { n: 0, dist: {} };
      b.n++;
      const s = row.severity || "unknown";
      b.dist[s] = (b.dist[s] || 0) + 1;
    });

    // LIPT-60 (psicossocial) per round — IGAP, NEAP, % flagged, subscale means
    const { data: psiRows } = await admin
      .from("psicossocial_responses")
      .select("round_no,scores,department")
      .eq("company_id", company_id);
    const psiPerRound: Record<number, {
      n: number;
      igap_sum: number;
      neap_sum: number;
      flagged: number;
      sub: Record<string, { sum: number; count: number }>;
      dept_flag: Record<string, number>;
    }> = {};
    (psiRows ?? []).forEach((row: any) => {
      const r = row.round_no ?? 1;
      const b = psiPerRound[r] = psiPerRound[r] || { n: 0, igap_sum: 0, neap_sum: 0, flagged: 0, sub: {}, dept_flag: {} };
      const s = row.scores || {};
      b.n++;
      if (typeof s.IGAP === "number") {
        b.igap_sum += s.IGAP;
        if (s.IGAP >= 0.5) {
          b.flagged++;
          const d = row.department || "—";
          b.dept_flag[d] = (b.dept_flag[d] || 0) + 1;
        }
      }
      if (typeof s.NEAP === "number") b.neap_sum += s.NEAP;
      for (const [k, v] of Object.entries(s)) {
        if (k === "IGAP" || k === "NEAP") continue;
        if (typeof v !== "number" || !isFinite(v)) continue;
        const acc = b.sub[k] = b.sub[k] || { sum: 0, count: 0 };
        acc.sum += v;
        acc.count++;
      }
    });

    // Assédio sexual (MDiSH + SHRAS) per round — totals + subscale means
    const { data: asxRows } = await admin
      .from("assedio_sexual_responses")
      .select("round_no,scores")
      .eq("company_id", company_id);
    const asxPerRound: Record<number, {
      n: number;
      mdish_sum: number; mdish_count: number;
      shras_sum: number; shras_count: number;
      any_endorsed: number;
      sub: Record<string, { sum: number; count: number }>;
    }> = {};
    (asxRows ?? []).forEach((row: any) => {
      const r = row.round_no ?? 1;
      const b = asxPerRound[r] = asxPerRound[r] || { n: 0, mdish_sum: 0, mdish_count: 0, shras_sum: 0, shras_count: 0, any_endorsed: 0, sub: {} };
      b.n++;
      const s = row.scores || {};
      if (typeof s.MDiSH_total === "number") { b.mdish_sum += s.MDiSH_total; b.mdish_count++; if (s.MDiSH_total > 1) b.any_endorsed++; }
      if (typeof s.SHRAS_total === "number") { b.shras_sum += s.SHRAS_total; b.shras_count++; }
      for (const [k, v] of Object.entries(s)) {
        if (k === "MDiSH_total" || k === "SHRAS_total") continue;
        if (typeof v !== "number" || !isFinite(v)) continue;
        const acc = b.sub[k] = b.sub[k] || { sum: 0, count: 0 };
        acc.sum += v;
        acc.count++;
      }
    });



    const roundsOut = roundList.map((r: any) => {
      const rn = r.round_no;
      const cps = copsoqPerRound[rn];
      const copsoqScales = cps
        ? Object.fromEntries(
            Object.entries(cps.scales).map(([k, v]) => [k, { mean: +(v.sum / v.count).toFixed(1), n: v.count }]),
          )
        : {};
      return {
        round_no: rn,
        opened_at: r.opened_at,
        closed_at: r.closed_at,
        devolutiva_communicated_at: r.devolutiva_communicated_at,
        devolutiva_notes: r.devolutiva_notes,
        status: r.devolutiva_communicated_at
          ? "devolutiva_communicated"
          : r.closed_at
            ? "closed"
            : "open",
        waves: perRoundCounts[rn] ?? {
          phq9: { scheduled: 0, sent: 0, completed: 0 },
          ecig: { scheduled: 0, sent: 0, completed: 0 },
          copsoq: { scheduled: 0, sent: 0, completed: 0 },
          psicossocial: { scheduled: 0, sent: 0, completed: 0 },
      assedio_sexual: { scheduled: 0, sent: 0, completed: 0 },
        },
        copsoq: {
          n: cps?.n_total ?? 0,
          hidden: (cps?.n_total ?? 0) < MIN_RECORTE,
          scales: (cps?.n_total ?? 0) < MIN_RECORTE ? {} : copsoqScales,
        },
        phq9: phqPerRound[rn]
          ? { n: phqPerRound[rn].n, hidden: phqPerRound[rn].n < MIN_RECORTE,
              severity_dist: phqPerRound[rn].n < MIN_RECORTE ? {} : phqPerRound[rn].dist }
          : { n: 0, hidden: true, severity_dist: {} },
      };
    });

    const canOpenNewRound =
      roundList.length === 0
        ? true
        : !!roundList[roundList.length - 1].devolutiva_communicated_at;

    return j({
      summary,
      period,
      rounds: roundsOut,
      min_recorte: MIN_RECORTE,
      can_open_new_round: canOpenNewRound,
      current_round: roundList.length ? roundList[roundList.length - 1].round_no : null,
    });
  } catch (e: any) {
    return j({ error: e.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
