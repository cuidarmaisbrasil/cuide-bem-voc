import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Master access-code helpers (kept inline — edge functions live in one file)
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
function generateAccessCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  return `CM-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}
async function hashCode(code: string): Promise<string> {
  const norm = code.trim().toUpperCase();
  const data = new TextEncoder().encode(norm);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { token, wave, answers, latencies_ms, demographics, extras } = body as {
      token: string;
      wave: "phq9" | "ecig" | "copsoq" | "psicossocial" | "assedio_sexual";
      answers: Record<string, number>;
      latencies_ms: Record<string, number>;
      demographics?: { age_range?: string; gender?: string; department?: string; tenure_range?: string };
      extras?: any;
    };
    if (!token || !wave || !answers || !latencies_ms) return j({ error: "bad_request" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: p } = await admin
      .from("wellness_participants")
      .select("id, company_id, token_hash, unsubscribed_at, access_code_hash")
      .eq("token", token)
      .maybeSingle();
    if (!p) return j({ error: "invalid_token" }, 404);
    if (p.unsubscribed_at) return j({ error: "unsubscribed" }, 410);

    const { data: inv } = await admin
      .from("wellness_invitations")
      .select("id,status,round_no")
      .eq("participant_id", p.id)
      .eq("wave", wave)
      .order("round_no", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!inv) return j({ error: "no_invitation" }, 404);
    if (inv.status === "completed") return j({ error: "already_completed" }, 409);

    const round_no = inv.round_no ?? 1;
    const demo = demographics || {};

    // Issue master access code on FIRST wave; reuse afterwards.
    let accessCodePlain: string | null = null;
    let accessCodeHash = p.access_code_hash as string | null;
    let isFirstIssue = false;
    if (!accessCodeHash) {
      accessCodePlain = generateAccessCode();
      accessCodeHash = await hashCode(accessCodePlain);
      isFirstIssue = true;
      await admin
        .from("wellness_participants")
        .update({ access_code_hash: accessCodeHash, access_code_issued_at: new Date().toISOString() })
        .eq("id", p.id);
    }


    if (wave === "phq9") {
      const phqAnswers = Array.from({ length: 9 }, (_, i) => Number(answers[String(i + 1)] ?? 0));
      const score = phqAnswers.reduce((a, b) => a + b, 0);
      const severity = score <= 4 ? "minimal" : score <= 9 ? "mild" : score <= 14 ? "moderate" : score <= 19 ? "moderately_severe" : "severe";
      const functional_impact = Number(answers["10"] ?? 0);
      await admin.from("phq9_company_responses").insert({
        company_id: p.company_id,
        round_no,
        participant_token_hash: p.token_hash,
        access_code_hash: accessCodeHash,
        answers,
        latencies_ms,
        score,
        severity,
        functional_impact,
        symptoms: extras?.symptoms ?? null,
        age: extras?.age ?? null,
        age_range: demo.age_range,
        gender: demo.gender,
        department: demo.department,
        tenure_range: demo.tenure_range,
      });

    } else if (wave === "ecig") {
      const { data: qs } = await admin
        .from("instrument_questions")
        .select("n,scale,reverse")
        .eq("instrument", "ecig")
        .eq("active", true);
      const sums: Record<string, { sum: number; n: number }> = {};
      (qs ?? []).forEach((q: any) => {
        const raw = Number(answers[String(q.n)] ?? 0);
        if (!raw) return;
        const v = q.reverse ? 6 - raw : raw;
        sums[q.scale] = sums[q.scale] || { sum: 0, n: 0 };
        sums[q.scale].sum += v;
        sums[q.scale].n += 1;
      });
      const scores: Record<string, number> = {};
      for (const k of Object.keys(sums)) scores[k] = +(sums[k].sum / sums[k].n).toFixed(2);
      await admin.from("ecig_responses").insert({
        company_id: p.company_id,
        round_no,
        participant_token_hash: p.token_hash,
        access_code_hash: accessCodeHash,
        answers,
        latencies_ms,
        scores,
        age_range: demo.age_range,
        gender: demo.gender,
        department: demo.department,
        tenure_range: demo.tenure_range,
      });

    } else if (wave === "copsoq") {
      await admin.from("copsoq_responses").insert({
        company_id: p.company_id,
        round_no,
        participant_token_hash: p.token_hash,
        access_code_hash: accessCodeHash,
        version: extras?.version || "short_br",
        answers,
        latencies_ms,
        scores: extras?.scores ?? null,
        age_range: demo.age_range,
        gender: demo.gender,
        department: demo.department,
        tenure_range: demo.tenure_range,
      });

    } else if (wave === "psicossocial") {
      const { data: qs } = await admin
        .from("instrument_questions")
        .select("n,scale,reverse")
        .eq("instrument", "lipt60")
        .eq("active", true);
      const sums: Record<string, { sum: number; n: number }> = {};
      const all: number[] = [];
      (qs ?? []).forEach((q: any) => {
        const raw = answers[String(q.n)];
        if (raw === undefined || raw === null) return;
        const v = q.reverse ? 4 - Number(raw) : Number(raw);
        const scale = q.scale || "geral";
        sums[scale] = sums[scale] || { sum: 0, n: 0 };
        sums[scale].sum += v;
        sums[scale].n += 1;
        all.push(v);
      });
      const scores: Record<string, number> = {};
      for (const k of Object.keys(sums)) scores[k] = +(sums[k].sum / sums[k].n).toFixed(2);
      if (all.length) {
        scores.IGAP = +(all.reduce((a, b) => a + b, 0) / all.length).toFixed(2);
        scores.NEAP = all.filter((v) => v > 0).length;
      }
      await admin.from("psicossocial_responses").insert({
        company_id: p.company_id,
        round_no,
        participant_token_hash: p.token_hash,
        access_code_hash: accessCodeHash,
        instrument: "lipt60",
        answers,
        latencies_ms,
        scores,
        age_range: demo.age_range,
        gender: demo.gender,
        department: demo.department,
        tenure_range: demo.tenure_range,
      });

    } else {
      const { data: qs } = await admin
        .from("instrument_questions")
        .select("n,scale,reverse")
        .eq("instrument", "assedio_sexual")
        .eq("active", true);
      const sums: Record<string, { sum: number; n: number }> = {};
      const mdishVals: number[] = [];
      const shrasVals: number[] = [];
      (qs ?? []).forEach((q: any) => {
        const raw = answers[String(q.n)];
        if (raw === undefined || raw === null) return;
        const v = q.reverse ? 6 - Number(raw) : Number(raw);
        const scale = q.scale || "geral";
        sums[scale] = sums[scale] || { sum: 0, n: 0 };
        sums[scale].sum += v;
        sums[scale].n += 1;
        if (scale.startsWith("mdish")) mdishVals.push(v);
        else if (scale === "shras") shrasVals.push(v);
      });
      const scores: Record<string, number> = {};
      for (const k of Object.keys(sums)) scores[k] = +(sums[k].sum / sums[k].n).toFixed(2);
      if (mdishVals.length) scores.MDiSH_total = +(mdishVals.reduce((a, b) => a + b, 0) / mdishVals.length).toFixed(2);
      if (shrasVals.length) scores.SHRAS_total = +(shrasVals.reduce((a, b) => a + b, 0) / shrasVals.length).toFixed(2);
      await admin.from("assedio_sexual_responses").insert({
        company_id: p.company_id,
        round_no,
        participant_token_hash: p.token_hash,
        access_code_hash: accessCodeHash,
        answers,
        latencies_ms,
        scores,
        age_range: demo.age_range,
        gender: demo.gender,
        department: demo.department,
        tenure_range: demo.tenure_range,
      });

    }

    await admin.from("wellness_invitations").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", inv.id);
    return j({ ok: true, access_code: accessCodePlain, access_code_first_issue: isFirstIssue });
  } catch (e: any) {
    console.error("wellness-submit error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
