import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { token, wave, answers, latencies_ms, demographics, extras } = body as {
      token: string;
      wave: "phq9" | "ecig" | "copsoq" | "psicossocial";
      answers: Record<string, number>;
      latencies_ms: Record<string, number>;
      demographics?: { age_range?: string; gender?: string; department?: string; tenure_range?: string };
      extras?: any;
    };
    if (!token || !wave || !answers || !latencies_ms) return j({ error: "bad_request" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: p } = await admin
      .from("wellness_participants")
      .select("id, company_id, token_hash, unsubscribed_at")
      .eq("token", token)
      .maybeSingle();
    if (!p) return j({ error: "invalid_token" }, 404);
    if (p.unsubscribed_at) return j({ error: "unsubscribed" }, 410);

    const { data: inv } = await admin
      .from("wellness_invitations")
      .select("id,status")
      .eq("participant_id", p.id)
      .eq("wave", wave)
      .maybeSingle();
    if (!inv) return j({ error: "no_invitation" }, 404);
    if (inv.status === "completed") return j({ error: "already_completed" }, 409);

    const demo = demographics || {};

    if (wave === "phq9") {
      const phqAnswers = Array.from({ length: 9 }, (_, i) => Number(answers[String(i + 1)] ?? 0));
      const score = phqAnswers.reduce((a, b) => a + b, 0);
      const severity = score <= 4 ? "minimal" : score <= 9 ? "mild" : score <= 14 ? "moderate" : score <= 19 ? "moderately_severe" : "severe";
      const functional_impact = Number(answers["10"] ?? 0);
      await admin.from("phq9_company_responses").insert({
        company_id: p.company_id,
        participant_token_hash: p.token_hash,
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
      // Score by subscale (tarefa, relacionamento, processo)
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
        participant_token_hash: p.token_hash,
        answers,
        latencies_ms,
        scores,
        age_range: demo.age_range,
        gender: demo.gender,
        department: demo.department,
        tenure_range: demo.tenure_range,
      });
    } else {
      // copsoq — reuse existing table, add token_hash + latencies
      await admin.from("copsoq_responses").insert({
        company_id: p.company_id,
        participant_token_hash: p.token_hash,
        version: extras?.version || "short_br",
        answers,
        latencies_ms,
        scores: extras?.scores ?? null,
        age_range: demo.age_range,
        gender: demo.gender,
        department: demo.department,
        tenure_range: demo.tenure_range,
      });
    }

    await admin.from("wellness_invitations").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", inv.id);
    return j({ ok: true });
  } catch (e: any) {
    return j({ error: e.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
