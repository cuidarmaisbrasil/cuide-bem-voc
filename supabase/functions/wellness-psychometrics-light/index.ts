// Computes psychometric metrics that can run natively in Deno (no external worker):
//   - Cronbach's alpha
//   - Harman single-factor (PCA on covariance, % variance of 1st component)
//   - Acquiescence index (paired reversed items)
//   - Midpoint %, straightlining %
//   - Pearson correlation with MC-SDS-10 (when available)
//
// CFA, omega, RMSEA, invariance and DIF are NOT computed here — they require
// the external Python worker (semopy/pingouin/statsmodels), wired in a follow-up.
//
// Inputs are aggregated server-side; raw responses never leave this function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Matrix = number[][]; // [respondent][item]

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function variance(xs: number[]) {
  const m = mean(xs);
  return xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1);
}
function covariance(xs: number[], ys: number[]) {
  const mx = mean(xs);
  const my = mean(ys);
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += (xs[i] - mx) * (ys[i] - my);
  return s / (xs.length - 1);
}

/** Cronbach's alpha (standardised covariance-based form). */
function cronbachAlpha(m: Matrix): number | null {
  const n = m.length;
  const k = m[0]?.length ?? 0;
  if (n < 10 || k < 2) return null;
  const itemVars: number[] = [];
  for (let j = 0; j < k; j++) {
    itemVars.push(variance(m.map((r) => r[j])));
  }
  const totals = m.map((r) => r.reduce((a, b) => a + b, 0));
  const totalVar = variance(totals);
  if (totalVar === 0) return null;
  const sumItemVar = itemVars.reduce((a, b) => a + b, 0);
  return (k / (k - 1)) * (1 - sumItemVar / totalVar);
}

/** % variance explained by 1st principal component (Harman single-factor test).
 *  Uses power iteration on the correlation matrix — exact enough for the test. */
function harmanFirstFactorPct(m: Matrix): number | null {
  const n = m.length;
  const k = m[0]?.length ?? 0;
  if (n < 30 || k < 3) return null;
  // Standardise
  const means: number[] = [];
  const sds: number[] = [];
  for (let j = 0; j < k; j++) {
    const col = m.map((r) => r[j]);
    means.push(mean(col));
    sds.push(Math.sqrt(variance(col)) || 1);
  }
  const z: Matrix = m.map((r) => r.map((v, j) => (v - means[j]) / sds[j]));
  // Correlation matrix
  const C: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
  for (let i = 0; i < k; i++) {
    for (let j = i; j < k; j++) {
      const c = covariance(z.map((r) => r[i]), z.map((r) => r[j]));
      C[i][j] = c;
      C[j][i] = c;
    }
  }
  // Power iteration for largest eigenvalue
  let v = Array(k).fill(1 / Math.sqrt(k));
  let lambda = 0;
  for (let it = 0; it < 200; it++) {
    const nv = Array(k).fill(0);
    for (let i = 0; i < k; i++)
      for (let j = 0; j < k; j++) nv[i] += C[i][j] * v[j];
    const norm = Math.sqrt(nv.reduce((a, b) => a + b * b, 0)) || 1;
    const nv2 = nv.map((x) => x / norm);
    const diff = nv2.reduce((a, b, idx) => a + Math.abs(b - v[idx]), 0);
    v = nv2;
    lambda = norm;
    if (diff < 1e-8) break;
  }
  // Trace of correlation matrix = k (standardised). 1st factor % = lambda / k.
  return (lambda / k) * 100;
}

/** Midpoint %: average per-respondent share of responses at the scale midpoint. */
function midpointPct(m: Matrix, scaleMin: number, scaleMax: number): number | null {
  if (!m.length) return null;
  const mid = (scaleMin + scaleMax) / 2;
  // Only meaningful for odd-length scales (integer midpoint).
  if (!Number.isInteger(mid)) return null;
  let total = 0;
  for (const r of m) {
    const hits = r.filter((v) => v === mid).length;
    total += hits / r.length;
  }
  return (total / m.length) * 100;
}

/** Straightlining %: share of respondents whose answers have ~zero variance. */
function straightliningPct(m: Matrix): number | null {
  if (!m.length) return null;
  let flagged = 0;
  for (const r of m) {
    if (r.length < 3) continue;
    if (variance(r) < 0.01) flagged++;
  }
  return (flagged / m.length) * 100;
}

/** Acquiescence: among reversed item pairs, share of respondents who agree with both. */
function acquiescenceIndex(
  m: Matrix,
  reversedPairs: [number, number][],
  agreeThreshold: number,
): number | null {
  if (!m.length || !reversedPairs.length) return null;
  let total = 0;
  let agreeBoth = 0;
  for (const r of m) {
    for (const [a, b] of reversedPairs) {
      total++;
      if (r[a] >= agreeThreshold && r[b] >= agreeThreshold) agreeBoth++;
    }
  }
  return total === 0 ? null : agreeBoth / total;
}

/** Pearson r */
function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 10 || xs.length !== ys.length) return null;
  const cov = covariance(xs, ys);
  const sx = Math.sqrt(variance(xs));
  const sy = Math.sqrt(variance(ys));
  if (sx === 0 || sy === 0) return null;
  return cov / (sx * sy);
}

// --- Instrument config ---
// Items per instrument (item count + scale + reversed pairs for acquiescence).
const INSTRUMENT_CONFIG: Record<
  string,
  { scaleMin: number; scaleMax: number; reversedPairs: [number, number][] }
> = {
  phq9: { scaleMin: 0, scaleMax: 3, reversedPairs: [] },
  ecig: { scaleMin: 1, scaleMax: 5, reversedPairs: [] }, // populate when reversed-keyed items confirmed
  copsoq: { scaleMin: 1, scaleMax: 5, reversedPairs: [] },
  lipt60: { scaleMin: 0, scaleMax: 4, reversedPairs: [] },
  mdish: { scaleMin: 1, scaleMax: 5, reversedPairs: [] },
  shras: { scaleMin: 1, scaleMax: 5, reversedPairs: [] },
};

// Fetch raw item-level responses for a given (company, round, instrument).
async function fetchResponses(
  sb: ReturnType<typeof createClient>,
  company_id: string,
  round_no: number,
  instrument: string,
): Promise<{ matrix: Matrix; sdsScores: number[] }> {
  const sdsScores: number[] = [];
  let matrix: Matrix = [];

  if (instrument === "phq9") {
    const { data } = await sb
      .from("phq9_company_responses")
      .select("answers")
      .eq("company_id", company_id)
      .eq("round_no", round_no);
    matrix = (data ?? [])
      .map((r: any) => (Array.isArray(r.answers) ? r.answers.map(Number) : null))
      .filter((r: any): r is number[] => r !== null && r.length === 9);
  } else if (instrument === "ecig") {
    const { data } = await sb
      .from("ecig_responses")
      .select("answers")
      .eq("company_id", company_id)
      .eq("round_no", round_no);
    matrix = (data ?? [])
      .map((r: any) => (Array.isArray(r.answers) ? r.answers.map(Number) : null))
      .filter((r: any): r is number[] => r !== null && r.length > 0);
  } else if (instrument === "copsoq") {
    const { data } = await sb
      .from("copsoq_responses")
      .select("answers, social_desirability_score")
      .eq("company_id", company_id)
      .eq("round_no", round_no);
    for (const r of data ?? []) {
      const ans = (r as any).answers;
      if (Array.isArray(ans)) matrix.push(ans.map(Number));
      if (typeof (r as any).social_desirability_score === "number")
        sdsScores.push((r as any).social_desirability_score);
    }
  } else if (instrument === "lipt60") {
    const { data } = await sb
      .from("psicossocial_responses")
      .select("answers")
      .eq("company_id", company_id)
      .eq("round_no", round_no);
    matrix = (data ?? [])
      .map((r: any) => (Array.isArray(r.answers) ? r.answers.map(Number) : null))
      .filter((r: any): r is number[] => r !== null && r.length > 0);
  } else if (instrument === "mdish" || instrument === "shras") {
    const { data } = await sb
      .from("assedio_sexual_responses")
      .select("answers, instrument")
      .eq("company_id", company_id)
      .eq("round_no", round_no)
      .eq("instrument", instrument);
    matrix = (data ?? [])
      .map((r: any) => (Array.isArray(r.answers) ? r.answers.map(Number) : null))
      .filter((r: any): r is number[] => r !== null && r.length > 0);
  }

  return { matrix, sdsScores };
}

async function getMinN(
  sb: ReturnType<typeof createClient>,
  company_id: string,
): Promise<number> {
  const { data } = await sb
    .from("wellness_company_settings")
    .select("n_min_cfa")
    .eq("company_id", company_id)
    .maybeSingle();
  return (data as any)?.n_min_cfa ?? 150;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    const body = await req.json().catch(() => ({}));
    const company_id: string = body.company_id;
    const round_no: number = body.round_no;
    const instruments: string[] = body.instruments ?? [
      "phq9",
      "ecig",
      "copsoq",
      "lipt60",
      "mdish",
      "shras",
    ];

    if (!company_id || typeof round_no !== "number") {
      return new Response(
        JSON.stringify({ error: "company_id and round_no required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const nMin = await getMinN(sb, company_id);
    const results: any[] = [];

    for (const inst of instruments) {
      const cfg = INSTRUMENT_CONFIG[inst];
      if (!cfg) continue;

      const { matrix, sdsScores } = await fetchResponses(sb, company_id, round_no, inst);
      const n = matrix.length;

      if (n < nMin) {
        await sb.from("wellness_psychometrics_runs").upsert(
          {
            company_id,
            round_no,
            instrument: inst,
            n_used: n,
            status: "insufficient_n",
            error_msg: `n=${n} < mínimo ${nMin}`,
            computed_at: new Date().toISOString(),
          },
          { onConflict: "company_id,round_no,instrument" },
        );
        results.push({ instrument: inst, status: "insufficient_n", n });
        continue;
      }

      const alpha = cronbachAlpha(matrix);
      const harman = harmanFirstFactorPct(matrix);
      const midpoint = midpointPct(matrix, cfg.scaleMin, cfg.scaleMax);
      const straight = straightliningPct(matrix);
      const acq = acquiescenceIndex(
        matrix,
        cfg.reversedPairs,
        Math.round((cfg.scaleMin + cfg.scaleMax) / 2) + 1,
      );

      let sdsR: number | null = null;
      if (sdsScores.length === n && sdsScores.length >= 10) {
        const totals = matrix.map((r) => r.reduce((a, b) => a + b, 0));
        sdsR = pearson(totals, sdsScores);
      }

      const bias_metrics = {
        cronbach_alpha: alpha,
        harman_first_factor_pct: harman,
        midpoint_pct: midpoint,
        straightlining_pct: straight,
        acquiescence_index: acq,
        social_desirability_r: sdsR,
      };

      // CFA / omega / RMSEA / invariance / DIF require external worker (not yet wired).
      await sb.from("wellness_psychometrics_runs").upsert(
        {
          company_id,
          round_no,
          instrument: inst,
          n_used: n,
          status: "ok",
          bias_metrics,
          fit_indices: null, // pending external worker
          invariance: null,  // pending external worker
          computed_at: new Date().toISOString(),
        },
        { onConflict: "company_id,round_no,instrument" },
      );
      results.push({ instrument: inst, status: "ok", n, bias_metrics });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[wellness-psychometrics-light]", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
