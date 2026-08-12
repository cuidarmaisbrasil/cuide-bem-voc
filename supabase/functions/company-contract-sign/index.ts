// Registra o aceite eletrônico simples do contrato da empresa (Lei 14.063/2020).
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");

    const body = await req.json().catch(() => ({}));
    const { company_id, version, contract_hash, signer_name, signer_cpf, signer_role, signer_email, headcount_declared } = body ?? {};
    if (!company_id || !contract_hash || !signer_name || !signer_cpf || !signer_role || !signer_email) {
      return j({ error: "bad_request", message: "Preencha nome, CPF, cargo e e-mail do signatário." }, 400);
    }

    const { data: co } = await admin.from("companies").select("id,owner_user_id,status").eq("id", company_id).maybeSingle();
    if (!co) return j({ error: "company_not_found" }, 404);

    const { data: wmLink } = await admin
      .from("company_wave_managers").select("id")
      .eq("company_id", company_id).eq("user_id", u.user.id).maybeSingle();

    if (!isAdmin && co.owner_user_id !== u.user.id && !wmLink) return j({ error: "forbidden" }, 403);

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const ip_hash = ip ? (await sha256(ip)).slice(0, 32) : null;

    const { data: created, error } = await admin
      .from("company_contracts")
      .insert({
        company_id,
        version: version || "v1",
        contract_hash,
        signer_name: String(signer_name).trim(),
        signer_cpf: String(signer_cpf).replace(/\D/g, ""),
        signer_role: String(signer_role).trim(),
        signer_email: String(signer_email).trim().toLowerCase(),
        headcount_declared: headcount_declared ?? null,
        ip_hash,
        user_agent: req.headers.get("user-agent"),
        status: "accepted",
      })
      .select("id, accepted_at, version, contract_hash")
      .single();
    if (error) return j({ error: error.message }, 500);

    return j({ ok: true, contract: created });
  } catch (e: any) {
    return j({ error: e.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
