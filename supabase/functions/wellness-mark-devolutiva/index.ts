// Mark devolutiva (results communicated to workers) for a given round.
// Closes the round and sets devolutiva_communicated_at. Required before
// a company can open a new round of screening waves (NR-1 participation
// of workers — perg. 17 of Q&A MTE Maio/2026).
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

    const body = await req.json().catch(() => ({}));
    const { company_id, round_no, notes } = body as { company_id: string; round_no: number; notes?: string };
    if (!company_id || !round_no) return j({ error: "bad_request" }, 400);

    if (!isAdmin) {
      const { data: co } = await admin.from("companies").select("owner_user_id,status").eq("id", company_id).maybeSingle();
      if (!co || co.owner_user_id !== user.id || co.status !== "approved") return j({ error: "forbidden" }, 403);
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("wellness_company_rounds")
      .update({
        devolutiva_communicated_at: now,
        closed_at: now,
        devolutiva_notes: notes ?? null,
      })
      .eq("company_id", company_id)
      .eq("round_no", round_no)
      .select("round_no, devolutiva_communicated_at, closed_at")
      .single();
    if (error) return j({ error: error.message }, 500);
    return j({ ok: true, round: data });
  } catch (e: any) {
    return j({ error: e.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
