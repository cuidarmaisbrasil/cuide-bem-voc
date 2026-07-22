// Open a new screening round for a company. Refuses if the previous
// round does not have devolutiva_communicated_at set (NR-1 worker
// participation gate — perg. 17 do Q&A MTE Maio/2026).
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

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
    const { company_id } = body as { company_id: string };
    if (!company_id) return j({ error: "bad_request" }, 400);

    if (!isAdmin) {
      const { data: co } = await admin.from("companies").select("owner_user_id,status").eq("id", company_id).maybeSingle();
      if (!co || co.owner_user_id !== user.id || co.status !== "approved") return j({ error: "forbidden" }, 403);
    }

    const { data: latest } = await admin
      .from("wellness_company_rounds")
      .select("round_no, devolutiva_communicated_at")
      .eq("company_id", company_id)
      .order("round_no", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest && !latest.devolutiva_communicated_at) {
      return j({
        error: "devolutiva_required",
        message: `A Rodada ${latest.round_no} ainda não teve a devolutiva comunicada aos trabalhadores. Marque a devolutiva antes de abrir uma nova rodada.`,
        current_round: latest.round_no,
      }, 409);
    }

    const nextRoundNo = (latest?.round_no ?? 0) + 1;
    const { data: created, error } = await admin
      .from("wellness_company_rounds")
      .insert({ company_id, round_no: nextRoundNo })
      .select("round_no, opened_at")
      .single();
    if (error) return j({ error: error.message }, 500);

    return j({ ok: true, round: created });
  } catch (e: any) {
    return j({ error: e.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
