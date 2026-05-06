// Edge function: tracks session start + heartbeats so we can compute real
// avg session duration. IP is hashed with the same salt as track-event so
// admin_ip_hashes can be used to exclude admins from analytics.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

function getGeo(req: Request) {
  return {
    country: req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null,
    region: req.headers.get("cf-region") || req.headers.get("x-vercel-ip-country-region") || null,
    city: req.headers.get("cf-ipcity") || req.headers.get("x-vercel-ip-city") || null,
  };
}

const trim = (v: unknown, max = 200) =>
  typeof v === "string" && v.length > 0 ? v.slice(0, max) : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const sessionId = trim(body?.session_id, 64);
    const event = body?.event === "start" ? "start" : "heartbeat";
    const attr = body?.attribution && typeof body.attribution === "object" ? body.attribution : {};
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const ip = getClientIp(req);
    const ipHash = await sha256(ip + ":" + (Deno.env.get("SUPABASE_PROJECT_ID") || "salt"));
    const geo = getGeo(req);
    const ua = (req.headers.get("user-agent") || "").slice(0, 500);

    if (event === "start") {
      const { error } = await supabase.from("sessions").upsert({
        session_id: sessionId,
        started_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        ip_hash: ipHash,
        country: geo.country, region: geo.region, city: geo.city,
        user_agent: ua,
        utm_source: trim(attr.utm_source),
        utm_medium: trim(attr.utm_medium),
        utm_campaign: trim(attr.utm_campaign),
        utm_content: trim(attr.utm_content),
        utm_term: trim(attr.utm_term),
        referrer: trim(attr.referrer),
        landing_path: trim(attr.landing_path),
      }, { onConflict: "session_id", ignoreDuplicates: true });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("sessions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_id", sessionId);
      if (error) throw error;
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("track-session error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
