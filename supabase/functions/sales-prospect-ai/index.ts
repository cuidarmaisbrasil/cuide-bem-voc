import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// AI prospecting agent for Cuidar+ Trabalho B2B sales.
// Uses Firecrawl to search the web for Brazilian companies matching the ICP,
// then Lovable AI Gateway (Gemini 2.5 Pro) to score fit, write outreach copy,
// and suggest the target role. Admin-only.

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-pro";

const ICP_BRIEF = `
Cuidar+ Trabalho é um programa brasileiro de saúde mental ocupacional em 5 ondas
(PHQ-9, COPSOQ, ECIG, LIPT-60, MDiSH/SHRAS + retest com GAD-7), alinhado à NR-1
(riscos psicossociais). Cliente ideal (ICP):
- Empresas brasileiras com ≥100 colaboradores (foco 100-5000).
- Setores de risco psicossocial alto: saúde/hospitais, call center/BPO, logística,
  bancos e financeiras, segurança pública/privada, educação, mineração, indústria
  pesada, varejo de grande porte, tecnologia com alta pressão.
- Empresas com sinais de dor: fiscalização MTE, obrigação NR-1 a cumprir, notícias
  de afastamentos por saúde mental, ações trabalhistas por assédio, alta rotatividade.
`;

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function firecrawlSearch(query: string, limit: number) {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY not configured");
  const r = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit,
      lang: "pt",
      country: "br",
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Firecrawl ${r.status}: ${text.slice(0, 300)}`);
  }
  return await r.json();
}

async function aiExtract(searchResults: any[], userQuery: string) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  // Compact context (title + url + snippet) to keep tokens sane.
  const items = (searchResults || []).slice(0, 20).map((r: any, i: number) => {
    const md = (r.markdown || r.description || "").toString().slice(0, 800);
    return `[${i + 1}] ${r.title || "(sem título)"}\nURL: ${r.url || ""}\n${md}`;
  }).join("\n\n---\n\n");

  const system = `Você é um analista de vendas B2B do Cuidar+ Trabalho.
Sua tarefa: extrair, a partir dos resultados de busca fornecidos, empresas brasileiras
reais que sejam potenciais clientes. Pontue o fit com o ICP e escreva uma copy curta
de prospecção em português.

${ICP_BRIEF}

Retorne APENAS JSON válido no formato:
{
  "prospects": [
    {
      "company_name": "Nome da empresa",
      "website": "https://... (opcional)",
      "sector": "Setor específico",
      "employee_size": "faixa estimada (ex: 500-1000)",
      "city": "cidade (opcional)",
      "state": "UF (opcional)",
      "fit_score": 0-100,
      "fit_rationale": "2-4 bullets em texto único explicando por que é fit. Cite gatilho/dor específica se houver.",
      "target_role": "Cargo-alvo para abordagem (ex: Diretor(a) de RH, Gerente de SESMT, Head de DHO)",
      "outreach_copy": "E-mail curto (máx 120 palavras) em PT-BR, personalizado, mencionando dor do setor e NR-1, com CTA claro para reunião de 20 min.",
      "source_urls": ["url1", "url2"]
    }
  ]
}

Regras:
- Só inclua empresas que aparecem nas fontes; NÃO invente.
- Descarte empresas com <100 colaboradores prováveis.
- fit_score 80-100: setor de alto risco + porte + gatilho de urgência.
- fit_score 60-79: setor + porte, sem gatilho claro.
- fit_score 40-59: só um critério forte.
- Máx 8 prospects. Ordene por fit_score desc.`;

  const user = `Consulta do vendedor: "${userQuery}"

Resultados de busca (web real):

${items}`;

  const r = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      "Lovable-API-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (r.status === 429) throw new Error("rate_limited");
  if (r.status === 402) throw new Error("credits_exhausted");
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`AI ${r.status}: ${text.slice(0, 300)}`);
  }
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.prospects) ? parsed.prospects : [];
  } catch {
    return [];
  }
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
    const {
      sector = "",
      employee_size = "100-1000",
      location = "Brasil",
      trigger = "",
      extra = "",
      save = true,
      limit = 8,
    } = body as {
      sector?: string; employee_size?: string; location?: string;
      trigger?: string; extra?: string; save?: boolean; limit?: number;
    };

    // Build a specific search query blending ICP + user filters.
    const queryParts = [
      sector && `empresas ${sector} no Brasil`,
      employee_size && `com ${employee_size} colaboradores`,
      location && location !== "Brasil" && `em ${location}`,
      trigger && trigger,
      extra && extra,
      "saúde mental ocupacional OR NR-1 OR bem-estar OR ESG",
    ].filter(Boolean).join(" ");

    if (!queryParts.trim()) return j({ error: "empty_query" }, 400);

    const search = await firecrawlSearch(queryParts, Math.min(20, Math.max(5, limit * 2)));
    // Firecrawl v2 shape: { success, data: { web: [...] } } or { data: [...] }
    const results: any[] =
      search?.data?.web ?? search?.data?.results ?? search?.data ?? search?.web ?? [];

    const prospects = await aiExtract(results, queryParts);

    let saved: any[] = [];
    if (save && prospects.length) {
      const rows = prospects.slice(0, limit).map((p: any) => ({
        company_name: String(p.company_name || "").slice(0, 200),
        website: p.website || null,
        sector: p.sector || sector || null,
        employee_size: p.employee_size || employee_size || null,
        city: p.city || null,
        state: p.state || null,
        fit_score: Math.max(0, Math.min(100, Number(p.fit_score) || 0)),
        fit_rationale: p.fit_rationale || null,
        target_role: p.target_role || null,
        outreach_copy: p.outreach_copy || null,
        source_urls: Array.isArray(p.source_urls) ? p.source_urls : [],
        search_query: queryParts,
        ai_model: AI_MODEL,
        created_by: user.id,
        status: "novo",
      })).filter((r) => r.company_name);

      if (rows.length) {
        const { data, error } = await admin
          .from("sales_prospects")
          .insert(rows)
          .select("*");
        if (error) return j({ error: "insert_failed", detail: error.message, prospects }, 500);
        saved = data ?? [];
      }
    }

    return j({ ok: true, query: queryParts, count: prospects.length, prospects, saved });
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg === "rate_limited") return j({ error: "rate_limited" }, 429);
    if (msg === "credits_exhausted") return j({ error: "credits_exhausted" }, 402);
    return j({ error: "internal", detail: msg }, 500);
  }
});
