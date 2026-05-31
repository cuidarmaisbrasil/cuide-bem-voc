// Edge function: gera resumo curto sobre o grau de severidade da depressão usando Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_SEVERITIES = [
  "Mínima",
  "Leve",
  "Moderada",
  "Moderadamente grave",
  "Grave",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { severity } = await req.json();
    if (!severity || typeof severity !== "string" || !ALLOWED_SEVERITIES.includes(severity)) {
      return new Response(JSON.stringify({ error: "severity inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Serve from cache (severity_articles.summary) when present.
    const { data: cached } = await supabase
      .from("severity_articles")
      .select("summary")
      .eq("severity", severity)
      .maybeSingle();
    if (cached?.summary) {
      return new Response(JSON.stringify({ summary: cached.summary, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Rate limit cache-miss path to prevent AI credit exhaustion.
    const rl = await checkRateLimit("severity-summary", req, 10, 3600);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Muitas requisições" }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfter),
        },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não configurada");
      return new Response(JSON.stringify({ error: "Serviço indisponível" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt =
      "Você é um educador em saúde mental. Escreva em português brasileiro, em linguagem acolhedora, clara e baseada em evidências (PHQ-9 / DSM-5 / OMS). Não dê diagnóstico. Não use jargão. Não inclua links nem listas. Máximo 4 frases curtas.";

    const userPrompt = `Explique de forma resumida o que significa um resultado de depressão "${severity}" no PHQ-9: o que esse nível geralmente representa em termos de sintomas e impacto, e qual costuma ser a recomendação geral de cuidado. Não diagnostique a pessoa.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições, tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar resumo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const summary = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Persist to cache so future calls skip the AI gateway entirely.
    if (summary) {
      await supabase
        .from("severity_articles")
        .update({ summary })
        .eq("severity", severity);
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("severity-summary error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
