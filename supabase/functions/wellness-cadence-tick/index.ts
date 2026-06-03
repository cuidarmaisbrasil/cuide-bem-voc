// Periodic worker:
//  (a) auto-opens a new round when the company has cadence_auto_open=true,
//      devolutiva done, and N months elapsed since last round.
//  (b) raises smart-trigger alerts in system_alerts:
//      - low adherence on current round (<min%)
//      - too long since last devolutiva (>max days)
// Idempotent: alerts deduped via unique alert_type+metadata.company_id+round.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    // Auth: service-role only.
    const auth = req.headers.get("Authorization") || "";
    if (!serviceKey || !auth.includes(serviceKey)) {
      // Allow authenticated admin too (manual trigger from UI).
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      let ok = false;
      if (auth && !auth.includes(anonKey)) {
        const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
          ok = !!roles?.some((r: any) => r.role === "admin");
        }
      }
      if (!ok) return j({ error: "unauthorized" }, 401);
    }

    const { data: companies } = await admin
      .from("companies")
      .select("id,name,status")
      .eq("status", "approved");

    let opened = 0; let alertsRaised = 0;
    const now = Date.now();

    for (const co of companies ?? []) {
      const { data: cfg } = await admin
        .from("wellness_company_settings")
        .select("*")
        .eq("company_id", co.id)
        .maybeSingle();
      const settings = cfg || {
        cadence_months: 4, cadence_auto_open: false,
        signal_min_adherence_pct: 40, signal_max_days_since_devolutiva: 180,
        signals_enabled: true,
      };

      const { data: lastRound } = await admin
        .from("wellness_company_rounds")
        .select("round_no, opened_at, devolutiva_communicated_at")
        .eq("company_id", co.id)
        .order("round_no", { ascending: false })
        .limit(1)
        .maybeSingle();

      // (a) auto-cadence
      if (settings.cadence_auto_open && lastRound?.devolutiva_communicated_at) {
        const elapsedMonths = (now - new Date(lastRound.devolutiva_communicated_at).getTime()) / (30 * 86400000);
        if (elapsedMonths >= settings.cadence_months) {
          const { error } = await admin.from("wellness_company_rounds")
            .insert({ company_id: co.id, round_no: lastRound.round_no + 1 });
          if (!error) opened++;
        }
      }

      // (b) signals
      if (settings.signals_enabled) {
        // signal 1: low adherence on current open round
        if (lastRound && !lastRound.devolutiva_communicated_at) {
          const { data: invs } = await admin
            .from("wellness_invitations")
            .select("status, round_no, wellness_participants!inner(company_id)")
            .eq("wellness_participants.company_id", co.id)
            .eq("round_no", lastRound.round_no);
          const total = invs?.length ?? 0;
          const completed = invs?.filter((i: any) => i.status === "completed").length ?? 0;
          const ageDays = (now - new Date(lastRound.opened_at).getTime()) / 86400000;
          if (total >= 10 && ageDays >= 14) {
            const pct = (completed / total) * 100;
            if (pct < settings.signal_min_adherence_pct) {
              alertsRaised += await raise(admin, "wellness_low_adherence", "warning",
                `Adesão baixa na Rodada #${lastRound.round_no} de ${co.name}: ${pct.toFixed(0)}% (limite ${settings.signal_min_adherence_pct}%)`,
                { company_id: co.id, round_no: lastRound.round_no, kind: "low_adherence" });
            }
          }
        }
        // signal 2: too long since last devolutiva
        const lastDev = lastRound?.devolutiva_communicated_at;
        if (lastDev) {
          const dDays = (now - new Date(lastDev).getTime()) / 86400000;
          if (dDays > settings.signal_max_days_since_devolutiva) {
            alertsRaised += await raise(admin, "wellness_stale_round", "warning",
              `${co.name}: ${Math.round(dDays)} dias desde a última devolutiva (limite ${settings.signal_max_days_since_devolutiva}). Recomendado abrir nova rodada.`,
              { company_id: co.id, round_no: lastRound.round_no, kind: "stale" });
          }
        }
      }
    }

    return j({ companies: companies?.length ?? 0, opened, alertsRaised });
  } catch (e: any) {
    console.error("wellness-cadence-tick error", e);
    return j({ error: "internal_error" }, 500);
  }
});

async function raise(admin: any, alert_type: string, severity: string, message: string, meta: any) {
  // Dedupe: don't insert if an unresolved alert with same company+kind+round exists
  const { data: existing } = await admin
    .from("system_alerts")
    .select("id")
    .eq("alert_type", alert_type)
    .eq("resolved", false)
    .contains("metadata", { company_id: meta.company_id, round_no: meta.round_no, kind: meta.kind })
    .limit(1);
  if (existing && existing.length) return 0;
  const { error } = await admin.from("system_alerts").insert({
    alert_type, severity, message, metadata: meta,
  });
  return error ? 0 : 1;
}

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
