

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const WAVE_LABEL: Record<string, string> = {
  phq9: "humor/depressão (PHQ-9)",
  gad7: "ansiedade (GAD-7)",
  ecig: "clima do grupo (ECIG)",
  copsoq: "bem-estar no trabalho (COPSOQ)",
  psicossocial: "clima psicossocial (LIPT-60)",
  assedio_sexual: "assédio sexual (MDiSH+SHRAS)",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { digest } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return j({ error: "missing_key" }, 500);
    if (!digest || !Array.isArray(digest.reports)) return j({ error: "bad_request" }, 400);

    // Build a compact, safe digest string
    const lines: string[] = [];
    for (const r of digest.reports) {
      const label = WAVE_LABEL[String(r.wave).replace(/_retest$/, "")] || r.wave;
      const retest = String(r.wave).endsWith("_retest") ? " (reteste)" : "";
      const bits: string[] = [`ciclo ${r.round_no}`];
      if (r.metrics?.score !== undefined && r.metrics?.score !== null) bits.push(`escore ${r.metrics.score}`);
      if (r.metrics?.severity) bits.push(`nível: ${r.metrics.severity}`);
      if (r.metrics?.scores && typeof r.metrics.scores === "object") {
        const top = Object.entries(r.metrics.scores as Record<string, number>)
          .filter(([, v]) => typeof v === "number")
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 3)
          .map(([k, v]) => `${k}=${Math.round(v as number)}`)
          .join(", ");
        if (top) bits.push(`dimensões principais: ${top}`);
      }
      lines.push(`- ${label}${retest} — ${bits.join("; ")}`);
    }

    const prompt = `Você é um psicólogo empático escrevendo uma devolutiva pessoal e acolhedora para um colaborador anônimo que respondeu questionários de bem-estar no trabalho.

Regras estritas:
- Escreva em português brasileiro, sempre na 2ª pessoa ("você").
- Tom conversacional, gentil e não-clínico. Nada de jargão técnico.
- 3 a 5 parágrafos curtos. Sem listas, sem títulos, sem markdown.
- Integre as ondas em um panorama único do "seu momento", ligando trabalho e saúde emocional quando fizer sentido.
- Se houver escore alto ou reteste com piora, reconheça isso com cuidado e sugira, sem prescrever, buscar apoio.
- Se houver melhora entre ciclos, celebre com sobriedade.
- Nunca cite nomes de instrumentos entre parênteses técnicos ao final; o objetivo é humano, não técnico.
- Não invente dados que não estejam abaixo.

Dados desta pessoa:
${lines.join("\n")}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error", res.status, text);
      if (res.status === 429) return j({ error: "rate_limited" }, 429);
      if (res.status === 402) return j({ error: "credits_exhausted" }, 402);
      return j({ error: "ai_error" }, 500);
    }
    const data = await res.json();
    const summary = data?.choices?.[0]?.message?.content?.trim() || "";
    return j({ summary });
  } catch (e: any) {
    console.error("wellness-individual-ai-summary error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
