import { supabase } from "@/integrations/supabase/client";

type TrackPayload =
  | { type: "test"; payload: { score: number; severity: string } }
  | {
      type: "click";
      payload: { link_type: "professional" | "sus" | "cvv" | "samu" | "platform" | "donation"; target_id?: string; target_label?: string };
    };

export async function track(event: TrackPayload) {
  try {
    await supabase.functions.invoke("track-event", { body: event });
  } catch (e) {
    // never break UX on tracking failures
    console.warn("tracking failed", e);
  }
}
