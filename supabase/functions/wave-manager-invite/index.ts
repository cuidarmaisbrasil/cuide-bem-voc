import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://cuidarmaisbrasil.life";

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

    const { data: co } = await admin
      .from("companies")
      .select("id,name,owner_user_id,wave_manager_name,wave_manager_email")
      .eq("id", company_id)
      .maybeSingle();
    if (!co) return j({ error: "company_not_found" }, 404);
    if (!isAdmin && co.owner_user_id !== u.user.id) return j({ error: "forbidden" }, 403);
    if (!co.wave_manager_email) return j({ error: "no_wave_manager" }, 400);

    const signupLink = `${APP_URL}/auth?wm=${co.id}&email=${encodeURIComponent(co.wave_manager_email)}`;

    const { error: sendErr } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "wave-manager-invite",
        recipientEmail: co.wave_manager_email,
        idempotencyKey: `wm-invite-${co.id}-${Date.now()}`,
        templateData: {
          companyName: co.name,
          managerName: co.wave_manager_name ?? "",
          signupLink,
        },
      },
    });
    if (sendErr) return j({ error: "send_failed", detail: sendErr.message }, 500);

    return j({ ok: true, signup_link: signupLink });
  } catch (e: any) {
    console.error("wave-manager-invite error", e);
    return j({ error: "internal_error", detail: e?.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
