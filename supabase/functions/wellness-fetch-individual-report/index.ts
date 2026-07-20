import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function hashCode(code: string): Promise<string> {
  const norm = code.trim().toUpperCase();
  const data = new TextEncoder().encode(norm);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Renders a template body with {{var}} placeholders against a flat values map.
function renderTemplate(body: string | null, vars: Record<string, any>): string {
  if (!body) return "";
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

function classifyPhq9(score: number): string {
  if (score <= 4) return "minimal";
  if (score <= 9) return "mild";
  if (score <= 14) return "moderate";
  if (score <= 19) return "moderately_severe";
  return "severe";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim().length < 8) {
      return j({ error: "bad_request" }, 400);
    }
    const access_code_hash = await hashCode(code);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: participant } = await admin
      .from("wellness_participants")
      .select("id, company_id, access_code_hash, access_code_first_used_at, companies!inner(id,name)")
      .eq("access_code_hash", access_code_hash)
      .maybeSingle();
    if (!participant) return j({ error: "invalid_code" }, 404);

    if (!participant.access_code_first_used_at) {
      await admin
        .from("wellness_participants")
        .update({ access_code_first_used_at: new Date().toISOString() })
        .eq("id", participant.id);
    }

    // Pull responses by access_code_hash across all waves
    const [phq9, gad7, ecig, copsoq, psicossocial, asx] = await Promise.all([
      admin.from("phq9_company_responses").select("round_no,score,severity,scores,functional_impact,latencies_ms,is_retest,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
      admin.from("gad7_company_responses").select("round_no,score,severity,latencies_ms,is_retest,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
      admin.from("ecig_responses").select("round_no,scores,latencies_ms,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
      admin.from("copsoq_responses").select("round_no,scores,version,latencies_ms,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
      admin.from("psicossocial_responses").select("round_no,scores,instrument,latencies_ms,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
      admin.from("assedio_sexual_responses").select("round_no,scores,latencies_ms,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
    ]);

    // Load all enabled templates once
    const { data: tpls } = await admin
      .from("individual_report_templates")
      .select("wave,section_key,severity,title,body,enabled,position,metadata")
      .eq("enabled", true)
      .order("position");

    const tplFor = (wave: string, severity: string = "all") =>
      (tpls ?? []).filter((t: any) => t.wave === wave && (t.severity === "all" || t.severity === severity));

    function renderSection(wave: string, severity: string, vars: Record<string, any>) {
      return tplFor(wave, severity).map((t: any) => ({
        section_key: t.section_key,
        severity: t.severity,
        title: renderTemplate(t.title, vars),
        body: renderTemplate(t.body, vars),
        metadata: t.metadata || {},
      }));
    }

    const globalSections = renderSection("global", "all", { company: (participant as any).companies?.name });

    // --- Timing helpers ---
    // Each `latencies_ms` is { "<n>": ms }. Compute total, median, min/max, per-item list.
    function summarizeTimings(latencies: Record<string, number> | null | undefined) {
      if (!latencies || typeof latencies !== "object") return null;
      const entries = Object.entries(latencies)
        .map(([k, v]) => ({ n: Number(k), ms: Number(v) }))
        .filter((e) => Number.isFinite(e.n) && Number.isFinite(e.ms) && e.ms >= 0 && e.ms < 30 * 60 * 1000)
        .sort((a, b) => a.n - b.n);
      if (!entries.length) return null;
      const ms = entries.map((e) => e.ms);
      const total_ms = ms.reduce((a, b) => a + b, 0);
      const sorted = [...ms].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median_ms = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
      const mean_ms = Math.round(total_ms / ms.length);
      return {
        n_items: entries.length,
        total_ms,
        mean_ms,
        median_ms,
        min_ms: sorted[0],
        max_ms: sorted[sorted.length - 1],
        per_item: entries, // [{n, ms}]
      };
    }

    const waves: Record<string, any> = {};

    (phq9.data ?? []).forEach((r: any) => {
      const sev = r.severity || classifyPhq9(Number(r.score || 0));
      const key = "phq9_" + r.round_no + (r.is_retest ? "_retest" : "");
      waves[key] = {
        wave: r.is_retest ? "phq9_retest" : "phq9",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { score: r.score, severity: sev, functional_impact: r.functional_impact },
        timings: summarizeTimings(r.latencies_ms),
        sections: renderSection("phq9", sev, { score: r.score, severity: sev, functional_impact: r.functional_impact ?? "" }),
      };
    });
    (gad7.data ?? []).forEach((r: any) => {
      waves["gad7_" + r.round_no + (r.is_retest ? "_retest" : "")] = {
        wave: r.is_retest ? "gad7_retest" : "gad7",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { score: r.score, severity: r.severity },
        timings: summarizeTimings(r.latencies_ms),
        sections: renderSection("gad7", r.severity || "all", { score: r.score, severity: r.severity ?? "" }),
      };
    });
    (ecig.data ?? []).forEach((r: any) => {
      waves["ecig_" + r.round_no] = {
        wave: "ecig",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { scores: r.scores },
        timings: summarizeTimings(r.latencies_ms),
        sections: renderSection("ecig", "all", { ...(r.scores || {}) }),
      };
    });
    (copsoq.data ?? []).forEach((r: any) => {
      waves["copsoq_" + r.round_no] = {
        wave: "copsoq",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { scores: r.scores, version: r.version },
        timings: summarizeTimings(r.latencies_ms),
        sections: renderSection("copsoq", "all", { ...(r.scores || {}) }),
      };
    });
    (psicossocial.data ?? []).forEach((r: any) => {
      waves["psicossocial_" + r.round_no] = {
        wave: "psicossocial",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { scores: r.scores },
        timings: summarizeTimings(r.latencies_ms),
        sections: renderSection("psicossocial", "all", { ...(r.scores || {}) }),
      };
    });
    (asx.data ?? []).forEach((r: any) => {
      waves["assedio_sexual_" + r.round_no] = {
        wave: "assedio_sexual",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { scores: r.scores },
        timings: summarizeTimings(r.latencies_ms),
        sections: renderSection("assedio_sexual", "all", { ...(r.scores || {}) }),
      };
    });

    // Build a per-wave cross-cycle comparison of timings.
    // Groups by wave key (phq9, gad7, ecig, copsoq, psicossocial, assedio_sexual)
    // regardless of is_retest, so the participant can see whether they became
    // faster or slower across rounds.
    const timingComparisons: Record<string, Array<{ round_no: number; is_retest?: boolean; total_ms: number; median_ms: number; mean_ms: number; n_items: number; completed_at: string }>> = {};
    Object.values(waves).forEach((w: any) => {
      if (!w.timings) return;
      const baseWave = String(w.wave).replace(/_retest$/, "");
      timingComparisons[baseWave] = timingComparisons[baseWave] || [];
      timingComparisons[baseWave].push({
        round_no: w.round_no,
        is_retest: String(w.wave).endsWith("_retest"),
        total_ms: w.timings.total_ms,
        median_ms: w.timings.median_ms,
        mean_ms: w.timings.mean_ms,
        n_items: w.timings.n_items,
        completed_at: w.completed_at,
      });
    });
    for (const k of Object.keys(timingComparisons)) {
      timingComparisons[k].sort((a, b) => a.round_no - b.round_no);
    }

    return j({
      company: { name: (participant as any).companies?.name },
      global_sections: globalSections,
      reports: Object.values(waves),
      timing_comparisons: timingComparisons,
    });
  } catch (e: any) {
    console.error("wellness-fetch-individual-report error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
