import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/calendly";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const CALENDLY_API_KEY = Deno.env.get("CALENDLY_API_KEY");
  if (!LOVABLE_API_KEY || !CALENDLY_API_KEY) return j({ error: "calendly_not_configured" }, 500);

  const headers = {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": CALENDLY_API_KEY,
  };

  try {
    const { status = "active" } = await req.json().catch(() => ({}));

    const meRes = await fetch(`${GATEWAY_URL}/users/me`, { headers });
    if (!meRes.ok) {
      const details = await meRes.text();
      return j({ error: "calendly_request_failed", status: meRes.status, details }, meRes.status);
    }
    const user = (await meRes.json())?.resource;

    const url = new URL(`${GATEWAY_URL}/scheduled_events`);
    url.searchParams.set("user", user.uri);
    url.searchParams.set("count", "50");
    url.searchParams.set("sort", "start_time:asc");
    if (status !== "all") url.searchParams.set("status", status);

    const evRes = await fetch(url.toString(), { headers });
    if (!evRes.ok) {
      const details = await evRes.text();
      return j({ error: "calendly_request_failed", status: evRes.status, details }, evRes.status);
    }
    const ev = await evRes.json();

    const events = await Promise.all(
      (ev?.collection ?? []).map(async (e: any) => {
        let invitees: any[] = [];
        try {
          const invRes = await fetch(`${e.uri}/invitees?count=10`.replace("https://api.calendly.com", GATEWAY_URL), { headers });
          if (invRes.ok) {
            const inv = await invRes.json();
            invitees = (inv?.collection ?? []).map((i: any) => ({
              name: i.name,
              email: i.email,
              status: i.status,
              cancel_url: i.cancel_url,
              reschedule_url: i.reschedule_url,
            }));
          }
        } catch { /* ignore invitee failures */ }

        return {
          uri: e.uri,
          name: e.name,
          status: e.status,
          start_time: e.start_time,
          end_time: e.end_time,
          location: e.location?.join_url ?? e.location?.location ?? e.location?.type ?? null,
          invitees,
        };
      })
    );

    return j({ timezone: user.timezone, scheduling_url: user.scheduling_url, events });
  } catch (e: any) {
    console.error("calendly-scheduled-events error", e);
    return j({ error: "unexpected", details: String(e?.message || e) }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
