import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM_EMAIL = "comercial@cuidarmaisbrasil.life";
const FROM_NAME = "Cuidar+ Trabalho";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const smtpPass = Deno.env.get("ZOHO_SMTP_APP_PASSWORD");
    if (!smtpPass) return j({ error: "smtp_not_configured" }, 500);

    // Admin-only
    const auth = req.headers.get("Authorization") || "";
    if (!auth) return j({ error: "unauthorized" }, 401);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return j({ error: "unauthorized" }, 401);
    const admin = createClient(url, serviceKey);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some((r: any) => r.role === "admin")) return j({ error: "forbidden" }, 403);

    const { to, subject, body, prospect_id } = await req.json();
    if (!to || !subject || !body) return j({ error: "missing_fields" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return j({ error: "invalid_email" }, 400);

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.zoho.com",
        port: 465,
        tls: true,
        auth: { username: FROM_EMAIL, password: smtpPass },
      },
    });

    try {
      await client.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        replyTo: FROM_EMAIL,
        subject,
        content: body,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;line-height:1.5;white-space:pre-wrap">${escapeHtml(body)}</div>`,
      });
    } finally {
      await client.close();
    }

    if (prospect_id) {
      await admin.rpc; // no-op guard
      const { data: cur } = await admin.from("sales_prospects").select("emailed_count,status").eq("id", prospect_id).maybeSingle();
      await admin.from("sales_prospects").update({
        last_emailed_at: new Date().toISOString(),
        emailed_count: (cur?.emailed_count ?? 0) + 1,
        status: cur?.status === "novo" ? "contatado" : cur?.status,
      }).eq("id", prospect_id);
    }

    return j({ ok: true });
  } catch (e: any) {
    console.error("send-commercial-email error", e);
    return j({ error: "send_failed", details: String(e?.message || e) }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
