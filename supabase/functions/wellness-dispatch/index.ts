import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TEMPLATE_NAME = 'wellness-invite';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    // Auth: admin only (or cron with service key — we accept service-role too)
    const auth = req.headers.get("Authorization") || "";
    let isAuthorized = auth.includes(serviceKey);
    if (!isAuthorized) {
      const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
        isAuthorized = !!roles?.some((r: any) => r.role === "admin");
      }
    }
    if (!isAuthorized) return j({ error: "unauthorized" }, 401);

    // Pick due invites
    const { data: due } = await admin
      .from("wellness_invitations")
      .select("id, wave, participant_id, attempts, wellness_participants!inner(token, email, unsubscribed_at, companies!inner(name, status, slug))")
      .eq("status", "pending")
      .is("sent_at", null)
      .lte("scheduled_at", new Date().toISOString())
      .limit(100);

    const publicBase = Deno.env.get("PUBLIC_APP_URL") || "https://cuidarmaisbrasil.life";
    let sent = 0; let skipped = 0; let failed = 0;

    for (const inv of due ?? []) {
      const p: any = (inv as any).wellness_participants;
      if (!p || p.unsubscribed_at || p.companies?.status !== "approved") {
        await admin.from("wellness_invitations").update({ status: "cancelled" }).eq("id", inv.id);
        skipped++; continue;
      }
      const link = `${publicBase}/w/${p.token}/${inv.wave}`;
      const tpl = { template: TEMPLATE_NAME };
      try {
        const { error } = await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: tpl.template,
            recipientEmail: p.email,
            idempotencyKey: `wellness-${inv.id}`,
            templateData: { companyName: p.companies.name, link, wave: inv.wave },
          },
        });
        if (error) throw error;
        await admin.from("wellness_invitations").update({ status: "sent", sent_at: new Date().toISOString(), attempts: (inv as any).attempts + 1 }).eq("id", inv.id);
        sent++;
      } catch (e: any) {
        await admin.from("wellness_invitations").update({ attempts: (inv as any).attempts + 1, last_error: String(e?.message || e) }).eq("id", inv.id);
        failed++;
      }
    }

    return j({ processed: (due ?? []).length, sent, skipped, failed });
  } catch (e: any) {
    return j({ error: e.message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
