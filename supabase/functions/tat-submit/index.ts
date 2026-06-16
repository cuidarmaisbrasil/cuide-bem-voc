import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { token, image_id, narrative, time_ms, started_at, demographics } = body as {
      token: string;
      image_id?: string | null;
      narrative: string;
      time_ms: number;
      started_at?: string | null;
      demographics?: { age_range?: string; gender?: string; department?: string; tenure_range?: string };
    };

    if (!token || typeof narrative !== "string" || !narrative.trim()) {
      return j({ error: "bad_request" }, 400);
    }
    if (narrative.length > 50000) return j({ error: "narrative_too_long" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: p } = await admin
      .from("wellness_participants")
      .select("id, company_id, token_hash, unsubscribed_at")
      .eq("token", token)
      .maybeSingle();
    if (!p) return j({ error: "invalid_token" }, 404);
    if (p.unsubscribed_at) return j({ error: "unsubscribed" }, 410);

    // Find current round from latest phq9 invitation (TAT runs alongside PHQ-9 wave)
    const { data: inv } = await admin
      .from("wellness_invitations")
      .select("round_no")
      .eq("participant_id", p.id)
      .eq("wave", "phq9")
      .order("round_no", { ascending: false })
      .limit(1)
      .maybeSingle();

    const round_no = inv?.round_no ?? 1;
    const demo = demographics || {};
    const capped_time = Math.max(0, Math.min(60 * 60 * 1000, Number(time_ms) || 0));

    const { error } = await admin.from("tat_responses").insert({
      company_id: p.company_id,
      round_no,
      participant_token_hash: p.token_hash,
      image_id: image_id || null,
      narrative: narrative.trim(),
      time_ms: capped_time,
      started_at: started_at || null,
      age_range: demo.age_range,
      gender: demo.gender,
      department: demo.department,
      tenure_range: demo.tenure_range,
    });
    if (error) {
      console.error("tat-submit insert error", error);
      return j({ error: "insert_failed" }, 500);
    }

    return j({ ok: true });
  } catch (e: any) {
    console.error("tat-submit error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
