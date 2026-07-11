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

    const { company_id } = await req.json();
    if (!company_id) return j({ error: "missing_company_id" }, 400);

    const email = (u.user.email ?? "").toLowerCase().trim();
    if (!email) return j({ error: "no_user_email" }, 400);

    const { data: co } = await admin
      .from("companies")
      .select("id,wave_manager_email,wave_manager_user_id")
      .eq("id", company_id)
      .maybeSingle();
    if (!co) return j({ error: "company_not_found" }, 404);
    if ((co.wave_manager_email ?? "").toLowerCase() !== email) {
      return j({ error: "email_mismatch" }, 403);
    }

    // Link user to company as wave manager
    const { error: linkErr } = await admin
      .from("company_wave_managers")
      .upsert({ company_id: co.id, user_id: u.user.id }, { onConflict: "company_id,user_id" });
    if (linkErr) return j({ error: "link_failed", detail: linkErr.message }, 500);

    // Attach role (idempotent)
    await admin
      .from("user_roles")
      .insert({ user_id: u.user.id, role: "wave_manager" })
      .then(() => {})
      .catch(() => {});

    // Update companies.wave_manager_user_id (first claim only)
    if (!co.wave_manager_user_id) {
      await admin
        .from("companies")
        .update({ wave_manager_user_id: u.user.id })
        .eq("id", co.id);
    }

    return j({ ok: true, company_id: co.id });
  } catch (e: any) {
    console.error("wave-manager-claim error", e);
    return j({ error: "internal_error", detail: e?.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
