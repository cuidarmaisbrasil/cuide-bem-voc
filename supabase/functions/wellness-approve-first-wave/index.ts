import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");

    const { company_id } = await req.json();
    if (!company_id) return j({ error: "missing_company_id" }, 400);

    // Authorize: admin OR wave manager of company OR owner
    const { data: co } = await admin
      .from("companies")
      .select("id,owner_user_id,status")
      .eq("id", company_id)
      .maybeSingle();
    if (!co) return j({ error: "company_not_found" }, 404);
    if (co.status !== "approved") return j({ error: "company_not_approved" }, 400);

    const { data: wmLink } = await admin
      .from("company_wave_managers")
      .select("id")
      .eq("company_id", company_id)
      .eq("user_id", u.user.id)
      .maybeSingle();

    if (!isAdmin && co.owner_user_id !== u.user.id && !wmLink) {
      return j({ error: "forbidden" }, 403);
    }

    // Find or create round 1
    const { data: existing } = await admin
      .from("wellness_company_rounds")
      .select("id,round_no,first_wave_approved_at")
      .eq("company_id", company_id)
      .eq("round_no", 1)
      .maybeSingle();

    let roundId = existing?.id;
    if (!roundId) {
      const { data: created, error: cErr } = await admin
        .from("wellness_company_rounds")
        .insert({ company_id, round_no: 1 })
        .select("id")
        .single();
      if (cErr || !created) return j({ error: "round_create_failed", detail: cErr?.message }, 500);
      roundId = created.id;
    } else if (existing?.first_wave_approved_at) {
      return j({ ok: true, already_approved: true });
    }

    const { error: updErr } = await admin
      .from("wellness_company_rounds")
      .update({
        first_wave_approved_at: new Date().toISOString(),
        first_wave_approved_by: u.user.id,
        opened_at: new Date().toISOString(),
      })
      .eq("id", roundId);
    if (updErr) return j({ error: "approve_failed", detail: updErr.message }, 500);

    return j({ ok: true, round_id: roundId });
  } catch (e: any) {
    console.error("wellness-approve-first-wave error", e);
    return j({ error: "internal_error", detail: e?.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
