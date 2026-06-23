import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function hashCode(code: string): Promise<string> {
  const norm = code.trim().toUpperCase();
  const data = new TextEncoder().encode(norm);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Renders a template body with {{var}} placeholders against a flat values map.
function renderTemplate(body: string | null, vars: Record<string, any>): string {
  if (!body) return "";
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

function classifyPhq9(score: number): string {
  if (score <= 4) return "minimal";
  if (score <= 9) return "mild";
  if (score <= 14) return "moderate";
  if (score <= 19) return "moderately_severe";
  return "severe";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim().length < 8) {
      return j({ error: "bad_request" }, 400);
    }
    const access_code_hash = await hashCode(code);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: participant } = await admin
      .from("wellness_participants")
      .select("id, company_id, access_code_hash, access_code_first_used_at, companies!inner(id,name)")
      .eq("access_code_hash", access_code_hash)
      .maybeSingle();
    if (!participant) return j({ error: "invalid_code" }, 404);

    if (!participant.access_code_first_used_at) {
      await admin
        .from("wellness_participants")
        .update({ access_code_first_used_at: new Date().toISOString() })
        .eq("id", participant.id);
    }

    // Pull responses by access_code_hash across all waves
    const [phq9, ecig, copsoq, psicossocial, asx] = await Promise.all([
      admin.from("phq9_company_responses").select("round_no,score,severity,scores,functional_impact,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
      admin.from("ecig_responses").select("round_no,scores,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
      admin.from("copsoq_responses").select("round_no,scores,version,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
      admin.from("psicossocial_responses").select("round_no,scores,instrument,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
      admin.from("assedio_sexual_responses").select("round_no,scores,created_at").eq("access_code_hash", access_code_hash).order("created_at"),
    ]);

    // Load all enabled templates once
    const { data: tpls } = await admin
      .from("individual_report_templates")
      .select("wave,section_key,severity,title,body,enabled,position,metadata")
      .eq("enabled", true)
      .order("position");

    const tplFor = (wave: string, severity: string = "all") =>
      (tpls ?? []).filter((t: any) => t.wave === wave && (t.severity === "all" || t.severity === severity));

    function renderSection(wave: string, severity: string, vars: Record<string, any>) {
      return tplFor(wave, severity).map((t: any) => ({
        section_key: t.section_key,
        severity: t.severity,
        title: renderTemplate(t.title, vars),
        body: renderTemplate(t.body, vars),
        metadata: t.metadata || {},
      }));
    }

    const globalSections = renderSection("global", "all", { company: (participant as any).companies?.name });

    const waves: Record<string, any> = {};

    (phq9.data ?? []).forEach((r: any) => {
      const sev = r.severity || classifyPhq9(Number(r.score || 0));
      waves["phq9_" + r.round_no] = {
        wave: "phq9",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { score: r.score, severity: sev, functional_impact: r.functional_impact },
        sections: renderSection("phq9", sev, { score: r.score, severity: sev, functional_impact: r.functional_impact ?? "" }),
      };
    });
    (ecig.data ?? []).forEach((r: any) => {
      waves["ecig_" + r.round_no] = {
        wave: "ecig",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { scores: r.scores },
        sections: renderSection("ecig", "all", { ...(r.scores || {}) }),
      };
    });
    (copsoq.data ?? []).forEach((r: any) => {
      waves["copsoq_" + r.round_no] = {
        wave: "copsoq",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { scores: r.scores, version: r.version },
        sections: renderSection("copsoq", "all", { ...(r.scores || {}) }),
      };
    });
    (psicossocial.data ?? []).forEach((r: any) => {
      waves["psicossocial_" + r.round_no] = {
        wave: "psicossocial",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { scores: r.scores },
        sections: renderSection("psicossocial", "all", { ...(r.scores || {}) }),
      };
    });
    (asx.data ?? []).forEach((r: any) => {
      waves["assedio_sexual_" + r.round_no] = {
        wave: "assedio_sexual",
        round_no: r.round_no,
        completed_at: r.created_at,
        metrics: { scores: r.scores },
        sections: renderSection("assedio_sexual", "all", { ...(r.scores || {}) }),
      };
    });

    return j({
      company: { name: (participant as any).companies?.name },
      global_sections: globalSections,
      reports: Object.values(waves),
    });
  } catch (e: any) {
    console.error("wellness-fetch-individual-report error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
