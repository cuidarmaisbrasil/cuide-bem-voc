import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return j({ error: "unauthorized" }, 401);

    const admin = createClient(url, serviceKey);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      const body = await req.json().catch(() => ({}));
      const { data: co } = await admin.from("companies").select("owner_user_id,status").eq("id", body.company_id).maybeSingle();
      if (!co || co.owner_user_id !== user.id || co.status !== "approved") return j({ error: "forbidden" }, 403);
    }

    const body = await req.json();
    const { company_id, email } = body as { company_id: string; email: string };
    if (!company_id || !email) return j({ error: "missing_params" }, 400);

    const { data: p } = await admin
      .from("wellness_participants")
      .select("id, token, email")
      .eq("company_id", company_id)
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    if (!p) return j({ participant: null, invitations: [] });

    const { data: invs } = await admin
      .from("wellness_invitations")
      .select("id, wave, round_no, status, scheduled_at, sent_at, completed_at, attempts, reminder_count, last_reminder_at, last_error")
      .eq("participant_id", p.id)
      .order("round_no", { ascending: false })
      .order("scheduled_at", { ascending: true });

    return j({ participant: p, invitations: invs ?? [] });
  } catch (e: any) {
    console.error("wellness-test-status error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
