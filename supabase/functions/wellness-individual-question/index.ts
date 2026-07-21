import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function hashCode(code: string): Promise<string> {
  const norm = code.trim().toUpperCase();
  const data = new TextEncoder().encode(norm);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { code, question } = await req.json();
    if (!code || !question || typeof question !== "string" || question.trim().length < 3) {
      return j({ error: "bad_request" }, 400);
    }
    if (question.length > 2000) return j({ error: "too_long" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const access_code_hash = await hashCode(code);

    const { data: participant } = await admin
      .from("wellness_participants")
      .select("id, company_id")
      .eq("access_code_hash", access_code_hash)
      .maybeSingle();
    if (!participant) return j({ error: "invalid_code" }, 404);

    // Store as feedback tagged for individual report Q&A. Anonymous: only hash + company_id.
    await admin.from("feedback").insert({
      message: question.trim(),
      source: "meu-relatorio",
      metadata: { company_id: (participant as any).company_id, access_code_hash },
    });

    return j({ ok: true });
  } catch (e: any) {
    console.error("wellness-individual-question error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
