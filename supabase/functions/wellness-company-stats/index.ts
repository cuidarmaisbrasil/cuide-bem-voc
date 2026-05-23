import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return j({ error: "unauthorized" }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");

    const u = new URL(req.url);
    const company_id = u.searchParams.get("company_id");
    const period = u.searchParams.get("period") || "all"; // '30d' | 'all'
    if (!company_id) return j({ error: "bad_request" }, 400);

    if (!isAdmin) {
      const { data: co } = await admin.from("companies").select("owner_user_id").eq("id", company_id).maybeSingle();
      if (!co || co.owner_user_id !== user.id) return j({ error: "forbidden" }, 403);
    }

    let q = admin
      .from("wellness_invitations")
      .select("wave,status,scheduled_at,sent_at,completed_at, wellness_participants!inner(company_id)")
      .eq("wellness_participants.company_id", company_id);
    if (period === "30d") {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      q = q.gte("scheduled_at", since);
    }
    const { data: invs } = await q;

    const summary: Record<string, { scheduled: number; sent: number; completed: number }> = {
      phq9: { scheduled: 0, sent: 0, completed: 0 },
      ecig: { scheduled: 0, sent: 0, completed: 0 },
      copsoq: { scheduled: 0, sent: 0, completed: 0 },
      psicossocial: { scheduled: 0, sent: 0, completed: 0 },
    };
    (invs ?? []).forEach((i: any) => {
      const s = summary[i.wave];
      if (!s) return;
      s.scheduled++;
      if (i.sent_at) s.sent++;
      if (i.status === "completed") s.completed++;
    });

    return j({ summary, period });
  } catch (e: any) {
    return j({ error: e.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
