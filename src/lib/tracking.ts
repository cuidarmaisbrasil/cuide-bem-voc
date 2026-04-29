import { supabase } from "@/integrations/supabase/client";
import { gaEvent } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";

type TrackPayload =
  | { type: "test"; payload: { score: number; severity: string; age?: number; symptoms?: string[] } }
  | {
      type: "click";
      payload: { link_type: "professional" | "sus" | "cvv" | "samu" | "platform" | "donation"; target_id?: string; target_label?: string };
    };

function mirrorToGa(event: TrackPayload) {
  try {
    if (event.type === "test") {
      gaEvent("test_completed", {
        score: event.payload.score,
        severity: event.payload.severity,
        age: event.payload.age,
      });
      return;
    }
    const { link_type, target_id, target_label } = event.payload;
    const params = { target_id, target_label, link_type };
    switch (link_type) {
      case "cvv":
      case "samu":
        gaEvent("emergency_click", params);
        return;
      case "professional":
        gaEvent("professional_click", params);
        return;
      case "sus":
        gaEvent("sus_click", params);
        return;
      case "donation":
        gaEvent("donation_click", params);
        return;
      case "platform":
        if (target_id?.startsWith("share-")) {
          gaEvent("share_click", { ...params, channel: target_id.replace("share-", "") });
          return;
        }
        gaEvent("platform_click", params);
        return;
    }
  } catch (e) {
    console.warn("ga mirror failed", e);
  }
}

export async function track(event: TrackPayload) {
  mirrorToGa(event);
  try {
    const attribution = getAttribution();
    await supabase.functions.invoke("track-event", {
      body: { ...event, attribution },
    });
  } catch (e) {
    // never break UX on tracking failures
    console.warn("tracking failed", e);
  }
}
