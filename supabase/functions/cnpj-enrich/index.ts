import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Enriches a sales_prospect with official Receita Federal data via
// CNPJ.ws public API (free, 3 req/min per IP). Only supports lookup by CNPJ —
// the public API does not offer name/CNAE search. Full search requires the
// paid Comercial API.

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCnpj(raw: string): string | null {
  const d = String(raw || "").replace(/\D+/g, "");
  return d.length === 14 ? d : null;
}

async function fetchCnpjWs(cnpj: string): Promise<any> {
  // Retry once on 429 with 21s backoff (public rate limit is 3/min).
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
      headers: { Accept: "application/json" },
    });
    if (r.status === 429 && attempt === 0) {
      await new Promise((res) => setTimeout(res, 21_000));
      continue;
    }
    if (r.status === 404) throw new Error("cnpj_not_found");
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`cnpj_ws_${r.status}: ${text.slice(0, 200)}`);
    }
    return await r.json();
  }
  throw new Error("cnpj_ws_rate_limited");
}

function extractFields(data: any) {
  const est = data?.estabelecimento ?? {};
  const cnae = est?.atividade_principal ?? {};
  const cnaeText = cnae?.subclasse && cnae?.descricao
    ? `${cnae.subclasse} — ${cnae.descricao}`
    : (cnae?.descricao || null);
  return {
    cnpj: est?.cnpj || null,
    razao_social: data?.razao_social || null,
    cnae_principal: cnaeText,
    situacao_cadastral: est?.situacao_cadastral || null,
    municipio: est?.cidade?.nome || null,
    uf: est?.estado?.sigla || null,
    porte_receita: data?.porte?.descricao || null,
    capital_social: data?.capital_social != null ? Number(data.capital_social) : null,
    data_abertura: est?.data_inicio_atividade || null,
    website: est?.email ? null : null, // CNPJ.ws public doesn't give a website; keep existing
  };
}

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
    if (!roles?.some((r: any) => r.role === "admin")) return j({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const cnpj = normalizeCnpj((body as any).cnpj);
    const prospect_id = typeof (body as any).prospect_id === "string" ? (body as any).prospect_id : null;
    if (!cnpj) return j({ error: "invalid_cnpj", detail: "Informe um CNPJ com 14 dígitos." }, 400);

    let receita: any;
    try {
      receita = await fetchCnpjWs(cnpj);
    } catch (e: any) {
      const m = String(e?.message || e);
      if (m === "cnpj_not_found") return j({ error: "cnpj_not_found" }, 404);
      if (m.startsWith("cnpj_ws_429") || m === "cnpj_ws_rate_limited") {
        return j({ error: "rate_limited", detail: "CNPJ.ws limita 3 consultas/min. Aguarde e tente de novo." }, 429);
      }
      return j({ error: "upstream_failed", detail: m }, 502);
    }

    const fields = extractFields(receita);

    if (prospect_id) {
      const patch: Record<string, unknown> = {
        cnpj: fields.cnpj ?? cnpj,
        razao_social: fields.razao_social,
        cnae_principal: fields.cnae_principal,
        situacao_cadastral: fields.situacao_cadastral,
        municipio: fields.municipio,
        uf: fields.uf,
        porte_receita: fields.porte_receita,
        capital_social: fields.capital_social,
        data_abertura: fields.data_abertura,
        enriched_at: new Date().toISOString(),
        enrichment_source: "cnpj.ws/publica",
      };
      // Backfill city/state if empty on the row.
      if (fields.municipio) patch.city = fields.municipio;
      if (fields.uf) patch.state = fields.uf;
      const { data: updated, error } = await admin
        .from("sales_prospects")
        .update(patch)
        .eq("id", prospect_id)
        .select("*")
        .maybeSingle();
      if (error) return j({ error: "update_failed", detail: error.message }, 500);
      return j({ ok: true, prospect: updated, fields });
    }

    return j({ ok: true, fields });
  } catch (e: any) {
    return j({ error: "internal", detail: String(e?.message || e) }, 500);
  }
});
