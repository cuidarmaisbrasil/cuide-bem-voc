// Submissão pública de respostas COPSOQ via slug da empresa
// Não requer autenticação — verifica empresa aprovada, computa scores no servidor.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALUE_MAP = [0, 25, 50, 75, 100];
function rawToScore(raw: number, reverse = false) {
  const v = VALUE_MAP[raw - 1] ?? 0;
  return reverse ? 100 - v : v;
}

interface Body {
  slug: string;
  version: "short" | "medium" | "long";
  answers: Record<string, number>; // {"1": 3, "2": 5, ...}
  questions: Array<{ n: number; scale: string; reverse?: boolean }>;
  demographics?: {
    age_range?: string;
    gender?: string;
    department?: string;
    tenure_range?: string;
  };
}

async function sha256(text: string) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: Body = await req.json();
    if (!body.slug || !body.version || !body.answers || !body.questions) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios ausentes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["short", "medium", "long"].includes(body.version)) {
      return new Response(JSON.stringify({ error: "Versão inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up company by slug, must be approved
    const { data: company, error: cErr } = await supabase
      .from("companies")
      .select("id, status, allowed_versions")
      .eq("slug", body.slug)
      .maybeSingle();

    if (cErr || !company) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (company.status !== "approved") {
      return new Response(JSON.stringify({ error: "Empresa ainda não aprovada" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (Array.isArray(company.allowed_versions) && !company.allowed_versions.includes(body.version)) {
      return new Response(JSON.stringify({ error: "Versão não habilitada para esta empresa" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute scale scores server-side
    const grouped = new Map<string, number[]>();
    for (const q of body.questions) {
      const raw = body.answers[String(q.n)];
      if (!raw || raw < 1 || raw > 5) continue;
      const score = rawToScore(raw, q.reverse);
      if (!grouped.has(q.scale)) grouped.set(q.scale, []);
      grouped.get(q.scale)!.push(score);
    }
    const scores: Record<string, { mean: number; n: number }> = {};
    for (const [k, v] of grouped) {
      scores[k] = { mean: Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10, n: v.length };
    }

    // IP hash (basic privacy)
    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const ip_hash = ip ? await sha256(ip + (Deno.env.get("SUPABASE_URL") || "")) : null;
    const ua = req.headers.get("user-agent") || null;

    const { error: insErr } = await supabase.from("copsoq_responses").insert({
      company_id: company.id,
      version: body.version,
      answers: body.answers,
      scores,
      age_range: body.demographics?.age_range ?? null,
      gender: body.demographics?.gender ?? null,
      department: body.demographics?.department ?? null,
      tenure_range: body.demographics?.tenure_range ?? null,
      ip_hash,
      user_agent: ua,
    });

    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
