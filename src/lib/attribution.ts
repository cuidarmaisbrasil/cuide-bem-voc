// Captures UTM parameters and referrer once per session and persists them in
// sessionStorage so every tracking event can be attributed to its origin
// (Instagram, Google Ads, partnership, etc.).

const KEY = "cuidar-attribution-v1";

export interface Attribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_path?: string | null;
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function clean(v: string | null | undefined): string | null {
  if (!v) return null;
  return v.toString().slice(0, 120);
}

export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return JSON.parse(existing);
  } catch {
    /* ignore */
  }

  const url = new URL(window.location.href);
  const data: Attribution = {
    landing_path: clean(url.pathname + url.search),
    referrer: clean(document.referrer || null),
  };
  for (const k of UTM_KEYS) {
    data[k] = clean(url.searchParams.get(k));
  }

  // If no UTM was provided, infer source from referrer host (best-effort)
  if (!data.utm_source && data.referrer) {
    try {
      const host = new URL(data.referrer).hostname.replace(/^www\./, "");
      if (host && !host.includes(window.location.hostname)) {
        data.utm_source = host;
        data.utm_medium = data.utm_medium || "referral";
      }
    } catch {
      /* ignore */
    }
  }

  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
  return data;
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return JSON.parse(existing);
  } catch {
    /* ignore */
  }
  return captureAttribution();
}
