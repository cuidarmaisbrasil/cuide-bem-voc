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

    const body = await req.json();
    const { company_id, emails, intervals_days } = body as {
      company_id: string; emails: string[]; intervals_days?: { phq9: number; ecig: number; copsoq: number };
    };

    // Authorization: admin OR company owner
    if (!isAdmin) {
      const { data: co } = await admin.from("companies").select("owner_user_id,status").eq("id", company_id).maybeSingle();
      if (!co || co.owner_user_id !== user.id || co.status !== "approved") return j({ error: "forbidden" }, 403);
    }

    const cleaned = Array.from(new Set((emails || [])
      .map((e) => (e || "").trim().toLowerCase())
      .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))));
    if (!cleaned.length) return j({ error: "no_valid_emails" }, 400);

    const iv = { phq9: 0, ecig: 15, copsoq: 30, ...(intervals_days || {}) };
    const now = new Date();

    const created: any[] = [];
    for (const email of cleaned) {
      const { data: p, error } = await admin
        .from("wellness_participants")
        .upsert({ company_id, email }, { onConflict: "company_id,email", ignoreDuplicates: false })
        .select("id, token")
        .single();
      if (error || !p) continue;

      const invites = (["phq9", "ecig", "copsoq"] as const).map((wave) => ({
        participant_id: p.id,
        wave,
        scheduled_at: new Date(now.getTime() + iv[wave] * 86400000).toISOString(),
        status: "pending",
      }));
      await admin.from("wellness_invitations").upsert(invites, { onConflict: "participant_id,wave", ignoreDuplicates: true });
      created.push({ email, token: p.token });
    }

    return j({ enrolled: created.length, participants: created });
  } catch (e: any) {
    return j({ error: e.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
