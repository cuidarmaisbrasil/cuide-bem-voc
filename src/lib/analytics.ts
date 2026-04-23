// Google Analytics 4 helper — wraps gtag with DNT/consent safety.
// Loaded via tag in index.html with ID G-40SCZSMH9X.

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const isDntEnabled = () => {
  if (typeof navigator === "undefined") return false;
  // Respect user's Do Not Track preference (LGPD-friendly)
  const dnt =
    navigator.doNotTrack ||
    (navigator as unknown as { msDoNotTrack?: string }).msDoNotTrack ||
    (window as unknown as { doNotTrack?: string }).doNotTrack;
  return dnt === "1" || dnt === "yes";
};

export type GaEventName =
  | "test_started"
  | "test_completed"
  | "share_click"
  | "emergency_click"
  | "professional_click"
  | "sus_click"
  | "platform_click"
  | "donation_click";

export function gaEvent(name: GaEventName, params: Record<string, unknown> = {}) {
  try {
    if (typeof window === "undefined" || isDntEnabled()) return;
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, params);
  } catch (e) {
    console.warn("ga event failed", e);
  }
}

export function gaPageView(path: string, title?: string) {
  try {
    if (typeof window === "undefined" || isDntEnabled()) return;
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title ?? document.title,
      page_location: window.location.href,
    });
  } catch (e) {
    console.warn("ga pageview failed", e);
  }
}
