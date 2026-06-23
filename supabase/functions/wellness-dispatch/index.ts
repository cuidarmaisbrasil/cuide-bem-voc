import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TEMPLATE_NAME = 'wellness-invite';
const DEFAULT_REMINDER_DAYS = [3, 7, 14];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    // Auth: service-role (cron) OR admin user.
    const auth = req.headers.get("Authorization") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    let isAuthorized = !!serviceKey && auth.includes(serviceKey);
    if (!isAuthorized && auth && !auth.includes(anonKey)) {
      const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
        isAuthorized = !!roles?.some((r: any) => r.role === "admin");
      }
    }
    if (!isAuthorized) return j({ error: "unauthorized" }, 401);

    const publicBase = Deno.env.get("PUBLIC_APP_URL") || "https://cuidarmaisbrasil.life";
    const nowIso = new Date().toISOString();
    const now = Date.now();

    // Editable footer note (fetched once per run)
    const { data: noteRow } = await admin
      .from("wellness_editable_texts")
      .select("content")
      .eq("key", "email_invite_work_hours_note")
      .maybeSingle();
    const workHoursNote = noteRow?.content || "";

    let sent = 0; let skipped = 0; let failed = 0; let reminded = 0;

    // ---- 1. Initial sends ----
    const { data: due } = await admin
      .from("wellness_invitations")
      .select("id, wave, participant_id, attempts, wellness_participants!inner(token, email, unsubscribed_at, companies!inner(name, status))")
      .eq("status", "pending")
      .is("sent_at", null)
      .lte("scheduled_at", nowIso)
      .limit(100);

    for (const inv of due ?? []) {
      const p: any = (inv as any).wellness_participants;
      if (!p || p.unsubscribed_at || p.companies?.status !== "approved") {
        await admin.from("wellness_invitations").update({ status: "cancelled" }).eq("id", inv.id);
        skipped++; continue;
      }
      const link = `${publicBase}/w/${p.token}/${inv.wave}`;
      try {
        const { error } = await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: TEMPLATE_NAME,
            recipientEmail: p.email,
            idempotencyKey: `wellness-${inv.id}`,
            templateData: { companyName: p.companies.name, link, wave: inv.wave, workHoursNote },
          },
        });
        if (error) throw error;
        await admin.from("wellness_invitations").update({
          status: "sent", sent_at: nowIso, attempts: (inv as any).attempts + 1,
        }).eq("id", inv.id);
        sent++;
      } catch (e: any) {
        await admin.from("wellness_invitations").update({
          attempts: (inv as any).attempts + 1, last_error: String(e?.message || e),
        }).eq("id", inv.id);
        failed++;
      }
    }

    // ---- 2. Reminders for sent-but-not-completed ----
    const { data: pendingSent } = await admin
      .from("wellness_invitations")
      .select("id, wave, sent_at, reminder_count, last_reminder_at, wellness_participants!inner(token, email, unsubscribed_at, company_id, companies!inner(name, status))")
      .eq("status", "sent")
      .is("completed_at", null)
      .limit(500);

    // Group by company to fetch reminder_days settings once
    const companyIds = Array.from(new Set((pendingSent ?? []).map((r: any) => r.wellness_participants.company_id)));
    const settingsByCo: Record<string, number[]> = {};
    if (companyIds.length) {
      const { data: cfgs } = await admin
        .from("wellness_company_settings")
        .select("company_id, reminder_days")
        .in("company_id", companyIds);
      (cfgs ?? []).forEach((c: any) => {
        settingsByCo[c.company_id] = Array.isArray(c.reminder_days) && c.reminder_days.length ? c.reminder_days : DEFAULT_REMINDER_DAYS;
      });
    }

    for (const inv of pendingSent ?? []) {
      const p: any = (inv as any).wellness_participants;
      if (!p || p.unsubscribed_at || p.companies?.status !== "approved") continue;
      const days = settingsByCo[p.company_id] ?? DEFAULT_REMINDER_DAYS;
      const sentAt = inv.sent_at ? new Date(inv.sent_at).getTime() : null;
      if (!sentAt) continue;
      const ageDays = (now - sentAt) / 86400000;
      const rc = inv.reminder_count ?? 0;
      if (rc >= days.length) continue;
      const nextThreshold = days[rc];
      if (ageDays < nextThreshold) continue;
      // Avoid double-firing within 24h
      if (inv.last_reminder_at && now - new Date(inv.last_reminder_at).getTime() < 86400000) continue;

      const link = `${publicBase}/w/${p.token}/${inv.wave}`;
      try {
        const { error } = await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: TEMPLATE_NAME,
            recipientEmail: p.email,
            idempotencyKey: `wellness-${inv.id}-rem${rc + 1}`,
            templateData: {
              companyName: p.companies.name,
              link,
              wave: inv.wave,
              reminder: rc + 1,
              workHoursNote,
            },
          },
        });
        if (error) throw error;
        await admin.from("wellness_invitations").update({
          reminder_count: rc + 1, last_reminder_at: nowIso,
        }).eq("id", inv.id);
        reminded++;
      } catch (e: any) {
        await admin.from("wellness_invitations").update({
          last_error: `reminder: ${String(e?.message || e)}`,
        }).eq("id", inv.id);
        failed++;
      }
    }

    return j({ processed: (due ?? []).length, sent, skipped, failed, reminded });
  } catch (e: any) {
    console.error("wellness-dispatch error", e);
    return j({ error: "internal_error" }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
