import { createClient } from "npm:@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// AI prospecting agent for Cuidar+ Trabalho B2B sales.
// Fan-out search: runs multiple targeted queries (sector synonyms + triggers +
// site: hints for lista/ranking pages) via Firecrawl, aggregates + dedupes
// results, then asks Lovable AI Gateway (Gemini 2.5 Pro) to extract prospects.

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

// Sector synonyms/expansions for fan-out queries (PT-BR web).
const SECTOR_EXPANSIONS: Record<string, string[]> = {
  "saúde": ["hospitais privados", "redes hospitalares", "operadoras de saúde", "planos de saúde", "clínicas de grande porte"],
  "call center": ["call center", "BPO", "contact center", "SAC terceirizado", "atendimento telefônico"],
  "logística": ["transportadoras", "logística e-commerce", "operadores logísticos", "centros de distribuição", "última milha"],
  "bancos": ["bancos", "financeiras", "cooperativas de crédito", "fintechs de crédito", "seguradoras"],
  "segurança": ["empresas de segurança privada", "vigilância patrimonial", "segurança pública", "polícias militares", "guardas municipais"],
  "educação": ["redes de ensino", "grupos educacionais", "universidades privadas", "faculdades particulares", "colégios de grande porte"],
  "mineração": ["mineradoras", "siderúrgicas", "metalúrgicas", "indústria pesada", "petroquímicas"],
  "varejo": ["redes de varejo", "supermercados", "atacarejo", "farmácias em rede", "lojas de departamento"],
  "tecnologia": ["empresas de tecnologia", "software houses", "unicórnios brasileiros", "empresas SaaS", "consultorias de TI"],
};

function normalizeSectorKey(sector: string): string {
  const s = sector.toLowerCase();
  for (const k of Object.keys(SECTOR_EXPANSIONS)) {
    if (s.includes(k)) return k;
  }
  return "";
}

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

function textField(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function numberField(value: unknown, fallback: number, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function dedupeResults(all: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const r of all) {
    const url = r?.url || "";
    const key = hostOf(url) + "|" + (r?.title || "").slice(0, 80).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

async function aiExtract(searchResults: any[], userQuery: string, alreadyKnown: string[], targetCount: number) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  // Compact context (title + url + snippet) to keep tokens sane.
  const items = (searchResults || []).slice(0, 40).map((r: any, i: number) => {
    const md = (r.markdown || r.description || r.content || "").toString().slice(0, 700);
    return `[${i + 1}] ${r.title || "(sem título)"}\nURL: ${r.url || ""}\n${md}`;
  }).join("\n\n---\n\n");

  const knownBlock = alreadyKnown.length
    ? `\n\nEmpresas JÁ presentes no pipeline (NÃO repita, escolha OUTRAS):\n${alreadyKnown.slice(0, 60).map((n) => `- ${n}`).join("\n")}`
    : "";

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
- Se o resultado é uma LISTA/RANKING (ex: "melhores empresas do setor X"), extraia
  cada empresa citada como um prospect separado (mesmo se o snippet for curto).
- Descarte só empresas obviamente muito pequenas (<50 colaboradores prováveis).
- fit_score 80-100: setor de alto risco + porte + gatilho de urgência.
- fit_score 60-79: setor + porte, sem gatilho claro.
- fit_score 40-59: só um critério forte.
- Retorne no MÍNIMO ${Math.min(targetCount, 6)} e no MÁXIMO ${targetCount} prospects, se as fontes permitirem.
- Ordene por fit_score desc.${knownBlock}`;

  const user = `Consulta do vendedor: "${userQuery}"

Resultados de busca (web real):

${items}`;

  const r = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
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

function buildQueries(sector: string, size: string, location: string, trigger: string, extra: string): string[] {
  const key = normalizeSectorKey(sector);
  const expansions = key ? SECTOR_EXPANSIONS[key] : [sector];
  const locPart = location && location !== "Brasil" ? ` em ${location}` : " no Brasil";
  const sizePart = size ? ` ${size} colaboradores` : "";

  const queries: string[] = [];
  // 1) Rankings & listas (alta densidade de nomes)
  for (const exp of expansions.slice(0, 3)) {
    queries.push(`maiores ${exp}${locPart} ranking 2024 2025`);
    queries.push(`lista ${exp}${locPart}${sizePart}`);
  }
  // 2) Fontes tipo "melhores para trabalhar" (proxy de porte + RH ativo)
  queries.push(`GPTW Great Place to Work ${expansions[0] || sector}${locPart}`);
  queries.push(`melhores empresas para trabalhar ${expansions[0] || sector}${locPart}`);
  // 3) Sinais NR-1 / saúde mental
  queries.push(`${expansions[0] || sector}${locPart} NR-1 riscos psicossociais programa saúde mental`);
  // 4) Gatilho customizado
  if (trigger) queries.push(`${expansions[0] || sector}${locPart} ${trigger}`);
  // 5) Extra
  if (extra) queries.push(`${expansions[0] || sector}${locPart} ${extra}`);

  // Dedup queries
  return Array.from(new Set(queries)).slice(0, 8);
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
    console.log("[sales-prospect-ai] body received:", JSON.stringify(body));
    const sector = textField((body as Record<string, unknown>).sector);
    const employee_size = textField((body as Record<string, unknown>).employee_size, "100-1000");
    const location = textField((body as Record<string, unknown>).location, "Brasil") || "Brasil";
    const trigger = textField((body as Record<string, unknown>).trigger);
    const extra = textField((body as Record<string, unknown>).extra);
    const save = (body as Record<string, unknown>).save !== false;
    const limit = numberField((body as Record<string, unknown>).limit, 8, 1, 20);

    if (!sector) return j({ error: "empty_query", detail: "Escolha um setor." }, 400);

    // Fan-out: build 5-8 targeted queries and run them in parallel.
    const queries = buildQueries(sector, employee_size, location, trigger, extra);
    console.log("[sales-prospect-ai] fan-out queries:", queries);

    const perQueryLimit = 6;
    const searchResults = await Promise.allSettled(
      queries.map((q) => firecrawlSearch(q, perQueryLimit)),
    );

    const merged: any[] = [];
    let firecrawlErrors = 0;
    for (const s of searchResults) {
      if (s.status === "rejected") { firecrawlErrors++; continue; }
      const data = s.value;
      const items: any[] =
        data?.data?.web ?? data?.data?.results ?? data?.data ?? data?.web ?? [];
      if (Array.isArray(items)) merged.push(...items);
    }
    const results = dedupeResults(merged);
    console.log("[sales-prospect-ai] merged results:", merged.length, "dedup:", results.length, "errors:", firecrawlErrors);

    if (results.length === 0) {
      return j({
        error: "no_search_results",
        detail: `Firecrawl retornou 0 resultados úteis (${firecrawlErrors} de ${queries.length} consultas falharam). Tente outro setor ou gatilho.`,
        queries,
      }, 200);
    }

    // Load already-known companies to prompt AI to bring new ones.
    const { data: known } = await admin
      .from("sales_prospects")
      .select("company_name")
      .order("created_at", { ascending: false })
      .limit(80);
    const knownNames = (known ?? []).map((r: any) => r.company_name).filter(Boolean);

    let prospects: any[] = [];
    try {
      prospects = await aiExtract(results, `${sector} · ${employee_size} · ${location}${trigger ? " · " + trigger : ""}`, knownNames, limit);
    } catch (ae: any) {
      const m = String(ae?.message || ae);
      console.error("[sales-prospect-ai] ai error:", m);
      if (m === "rate_limited") return j({ error: "rate_limited" }, 429);
      if (m === "credits_exhausted") return j({ error: "credits_exhausted" }, 402);
      return j({ error: "ai_failed", detail: m }, 502);
    }

    // Client-side dedup against known names (case-insensitive).
    const knownLower = new Set(knownNames.map((n: string) => n.toLowerCase().trim()));
    prospects = prospects.filter((p) => {
      const n = String(p?.company_name || "").toLowerCase().trim();
      return n && !knownLower.has(n);
    });
    console.log("[sales-prospect-ai] prospects after dedup:", prospects.length);

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
        search_query: queries.join(" | "),
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

    return j({
      ok: true,
      queries,
      queries_ok: queries.length - firecrawlErrors,
      results_found: results.length,
      count: prospects.length,
      prospects,
      saved,
    });
  } catch (e: any) {
    const msg = String(e?.message || e);
    console.error("[sales-prospect-ai] TOP-LEVEL error:", msg, e?.stack);
    if (msg === "rate_limited") return j({ error: "rate_limited" }, 429);
    if (msg === "credits_exhausted") return j({ error: "credits_exhausted" }, 402);
    return j({ error: "internal", detail: msg }, 500);
  }
});
