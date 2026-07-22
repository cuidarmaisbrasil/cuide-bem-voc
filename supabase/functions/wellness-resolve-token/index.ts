import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const wave = url.searchParams.get("wave");
    if (!token || !wave || !["phq9", "ecig", "copsoq", "psicossocial", "assedio_sexual", "phq9_retest"].includes(wave)) return j({ error: "bad_request" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: p } = await admin
      .from("wellness_participants")
      .select("id, company_id, unsubscribed_at, companies!inner(id,name,status,default_version)")
      .eq("token", token)
      .maybeSingle();
    if (!p) return j({ error: "invalid_token" }, 404);
    if (p.unsubscribed_at) return j({ error: "unsubscribed" }, 410);

    const { data: inv } = await admin
      .from("wellness_invitations")
      .select("id,status,completed_at")
      .eq("participant_id", p.id)
      .eq("wave", wave)
      .maybeSingle();
    if (!inv) return j({ error: "no_invitation" }, 404);
    if (inv.status === "completed") return j({ status: "completed", company: { name: (p as any).companies.name } });

    // Pull active questions; for COPSOQ use default_version, else 'phq9' or 'ecig'
    const instrument = wave === "copsoq"
      ? `copsoq_${(p as any).companies.default_version || "short_br"}`
      : wave === "psicossocial" ? "lipt60"
      : wave === "assedio_sexual" ? "assedio_sexual"
      : wave === "phq9_retest" ? "phq9"
      : wave;
    const { data: qs } = await admin
      .from("instrument_questions")
      .select("n,text,scale,reverse,response_set")
      .eq("instrument", instrument)
      .eq("active", true)
      .order("n");

    // Onda 1 (phq9) e Onda 5 (phq9_retest) incluem o GAD-7 na mesma sessão
    let gad7Questions: any[] = [];
    if (wave === "phq9" || wave === "phq9_retest") {
      const { data: gq } = await admin
        .from("instrument_questions")
        .select("n,text,scale,reverse,response_set")
        .eq("instrument", "gad7")
        .eq("active", true)
        .order("n");
      gad7Questions = gq ?? [];
    }

    // Mark opened_at
    await admin.from("wellness_invitations").update({ opened_at: new Date().toISOString() }).eq("id", inv.id).is("opened_at", null);

    return j({
      company: { id: p.company_id, name: (p as any).companies.name },
      wave,
      instrument,
      questions: qs ?? [],
      gad7_questions: gad7Questions,
    });
  } catch (e: any) {
    console.error("wellness-resolve-token error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
