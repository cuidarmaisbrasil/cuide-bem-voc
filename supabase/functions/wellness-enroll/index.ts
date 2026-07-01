import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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
    const isAdmin = roles?.some((r: any) => r.role === "admin");

    const body = await req.json();
    const { company_id, emails, intervals_days, intervals_minutes } = body as {
      company_id: string; emails: string[];
      intervals_days?: { phq9: number; copsoq: number; ecig: number; psicossocial?: number; phq9_retest?: number; assedio_sexual?: number };
      intervals_minutes?: { phq9: number; copsoq: number; ecig: number; psicossocial?: number; phq9_retest?: number; assedio_sexual?: number };
    };

    // Authorization: admin OR company owner
    if (!isAdmin) {
      const { data: co } = await admin.from("companies").select("owner_user_id,status").eq("id", company_id).maybeSingle();
      if (!co || co.owner_user_id !== user.id || co.status !== "approved") return j({ error: "forbidden" }, 403);
    }

    const cleaned = Array.from(new Set((emails || [])
      .map((e) => (e || "").trim().toLowerCase())
      .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))));
    if (!cleaned.length) return j({ error: "no_valid_emails" }, 400);

    // Determine current open round. If none exists, create round 1.
    const { data: latestRound } = await admin
      .from("wellness_company_rounds")
      .select("round_no, closed_at, devolutiva_communicated_at")
      .eq("company_id", company_id)
      .order("round_no", { ascending: false })
      .limit(1)
      .maybeSingle();

    let roundNo = latestRound?.round_no ?? null;
    if (!roundNo) {
      const { data: created, error: rErr } = await admin
        .from("wellness_company_rounds")
        .insert({ company_id, round_no: 1 })
        .select("round_no")
        .single();
      if (rErr || !created) return j({ error: "round_create_failed", detail: rErr?.message }, 500);
      roundNo = created.round_no;
    }

    // New wave order: 1=PHQ-9(+TAT), 2=COPSOQ, 3=ECIG(+Rorschach), 4=LIPT-60 + PHQ-9 retest (same day), 5=MDiSH+SHRAS
    const ivDays = { phq9: 1, copsoq: 7, ecig: 15, psicossocial: 22, phq9_retest: 22, assedio_sexual: 30, ...(intervals_days || {}) };
    const ivMin = intervals_minutes ? { phq9: 0, copsoq: 1, ecig: 2, psicossocial: 3, phq9_retest: 3, assedio_sexual: 4, ...intervals_minutes } : null;
    const now = new Date();

    const WAVES = ["phq9", "copsoq", "ecig", "psicossocial", "phq9_retest", "assedio_sexual"] as const;

    const created: any[] = [];
    for (const email of cleaned) {
      const { data: p, error } = await admin
        .from("wellness_participants")
        .upsert({ company_id, email }, { onConflict: "company_id,email", ignoreDuplicates: false })
        .select("id, token")
        .single();
      if (error || !p) continue;

      const invites = WAVES.map((wave) => {
        const offsetMs = ivMin
          ? (ivMin as any)[wave] * 60_000
          : (ivDays as any)[wave] * 86_400_000;
        return {
          participant_id: p.id,
          wave,
          round_no: roundNo,
          scheduled_at: new Date(now.getTime() + offsetMs).toISOString(),
          status: "pending",
        };
      });
      await admin.from("wellness_invitations").upsert(invites, { onConflict: "participant_id,wave,round_no", ignoreDuplicates: true });
      created.push({ email, token: p.token });
    }

    return j({ enrolled: created.length, round_no: roundNo, participants: created });
  } catch (e: any) {
    console.error("wellness-enroll error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
