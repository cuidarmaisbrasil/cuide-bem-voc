// Tracks browser sessions so we can compute real avg session duration.
// Heartbeats every 30s while the tab is visible; emits a final beat on
// visibility change for accurate end times.
import { supabase } from "@/integrations/supabase/client";
import { getAttribution } from "@/lib/attribution";

const SESSION_KEY = "cuidar-session-id-v1";
const HEARTBEAT_MS = 30_000;

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

let started = false;

async function ping(event: "start" | "heartbeat") {
  try {
    await supabase.functions.invoke("track-session", {
      body: {
        session_id: getOrCreateSessionId(),
        event,
        attribution: getAttribution(),
      },
    });
  } catch (e) {
    console.warn("session tracking failed", e);
  }
}

export function startSessionTracking() {
  if (started || typeof window === "undefined") return;
  started = true;

  void ping("start");

  window.setInterval(() => {
    if (document.visibilityState === "visible") void ping("heartbeat");
  }, HEARTBEAT_MS);

  const finalBeat = () => void ping("heartbeat");
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") finalBeat();
  });
  window.addEventListener("pagehide", finalBeat);
}
