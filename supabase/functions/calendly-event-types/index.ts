import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/calendly";

let cache: { at: number; body: unknown } | null = null;
const TTL_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const CALENDLY_API_KEY = Deno.env.get("CALENDLY_API_KEY");
  if (!LOVABLE_API_KEY || !CALENDLY_API_KEY) {
    return j({ error: "calendly_not_configured" }, 500);
  }

  if (cache && Date.now() - cache.at < TTL_MS) return j(cache.body);

  const headers = {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": CALENDLY_API_KEY,
  };

  try {
    const meRes = await fetch(`${GATEWAY_URL}/users/me`, { headers });
    if (!meRes.ok) {
      const details = await meRes.text();
      console.error(`calendly /users/me failed [${meRes.status}]: ${details}`);
      return j({ error: "calendly_request_failed", status: meRes.status, details }, meRes.status);
    }
    const me = await meRes.json();
    const user = me?.resource;

    const url = new URL(`${GATEWAY_URL}/event_types`);
    url.searchParams.set("user", user.uri);
    url.searchParams.set("active", "true");
    url.searchParams.set("count", "20");

    const etRes = await fetch(url.toString(), { headers });
    if (!etRes.ok) {
      const details = await etRes.text();
      console.error(`calendly /event_types failed [${etRes.status}]: ${details}`);
      return j({ error: "calendly_request_failed", status: etRes.status, details }, etRes.status);
    }
    const et = await etRes.json();

    const body = {
      scheduling_url: user.scheduling_url as string,
      timezone: user.timezone as string,
      event_types: (et?.collection ?? []).map((e: any) => ({
        name: e.name,
        duration: e.duration,
        scheduling_url: e.scheduling_url,
        color: e.color,
        description: e.description_plain ?? null,
      })),
    };

    cache = { at: Date.now(), body };
    return j(body);
  } catch (e: any) {
    console.error("calendly-event-types error", e);
    return j({ error: "unexpected", details: String(e?.message || e) }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
