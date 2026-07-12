// useTelemetry — captura sinais comportamentais não-declarativos durante o preenchimento
// de instrumentos psicométricos. Fase 1: timing por item, foco/blur, paste, fingerprint
// básico. Buffer local + flush por batch para /telemetry-ingest.
//
// Privacidade: nunca coleta conteúdo de campos livres, apenas metadados de interação.

import { useCallback, useEffect, useMemo, useRef } from "react";

export type TelemetryEvent = {
  instrument?: string;
  item_index?: number | null;
  event_type: "view" | "first_touch" | "change" | "submit" | "blur" | "focus" | "paste" | "scroll" | "start" | "end";
  t_ms: number;
  value?: unknown;
  meta?: Record<string, unknown>;
};

type Options = {
  enabled: boolean;
  sessionToken: string | null | undefined;
  instrument: string | null | undefined;
  companyId?: string | null;
  roundNo?: number | null;
};

const FLUSH_INTERVAL_MS = 10_000;
const MAX_BUFFER = 40;

function detectDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

function detectOS(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iOS/i.test(ua)) return "iOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "unknown";
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  return "other";
}

async function computeFingerprint(): Promise<string> {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      String(screen.width),
      String(screen.height),
      String(window.devicePixelRatio || 1),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      String((navigator as any).hardwareConcurrency ?? ""),
      String((navigator as any).deviceMemory ?? ""),
    ];
    // canvas hash
    try {
      const c = document.createElement("canvas");
      c.width = 200; c.height = 40;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(0, 0, 200, 40);
        ctx.fillStyle = "#069";
        ctx.fillText("cuidar-mais-fp-🩺", 2, 2);
        parts.push(c.toDataURL().slice(-64));
      }
    } catch { /* ignore */ }

    const data = new TextEncoder().encode(parts.join("|"));
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    return "unknown";
  }
}

export function useTelemetry(opts: Options) {
  const { enabled, sessionToken, instrument, companyId = null, roundNo = null } = opts;
  const startTimeRef = useRef<number>(0);
  const bufferRef = useRef<TelemetryEvent[]>([]);
  const deviceRef = useRef<Record<string, unknown> | null>(null);
  const initSentRef = useRef(false);
  const flushingRef = useRef(false);
  const lastFlushRef = useRef(0);

  const active = Boolean(enabled && sessionToken && instrument);

  const ingestUrl = useMemo(() => {
    const base = import.meta.env.VITE_SUPABASE_URL;
    return base ? `${base}/functions/v1/telemetry-ingest` : null;
  }, []);

  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // build device info once
  useEffect(() => {
    if (!active || deviceRef.current) return;
    let cancelled = false;
    (async () => {
      const fp = await computeFingerprint();
      if (cancelled) return;
      deviceRef.current = {
        fingerprint_hash: fp,
        user_agent: navigator.userAgent,
        device_type: detectDeviceType(),
        os_name: detectOS(),
        browser_name: detectBrowser(),
        viewport_w: window.innerWidth,
        viewport_h: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
        screen_w: screen.width,
        screen_h: screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language,
      };
      startTimeRef.current = Date.now();
      // envia primeiro flush (init) — cria sessão
      void sendBatch("init", []);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const sendBatch = useCallback(async (
    mode: "init" | "flush" | "submit",
    events: TelemetryEvent[],
  ) => {
    if (!ingestUrl || !sessionToken || !instrument) return;
    const payload = {
      session_token: sessionToken,
      mode,
      instrument,
      company_id: companyId,
      round_no: roundNo,
      device: deviceRef.current,
      events,
    };
    try {
      // beforeunload → sendBeacon; caso contrário fetch normal
      if (mode === "submit" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon(ingestUrl, blob);
        return;
      }
      await fetch(ingestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch { /* silent */ }
  }, [ingestUrl, sessionToken, instrument, companyId, roundNo, apiKey]);

  const flush = useCallback(async () => {
    if (!active || flushingRef.current) return;
    const events = bufferRef.current;
    if (!events.length) return;
    flushingRef.current = true;
    const batch = events.splice(0, events.length);
    lastFlushRef.current = Date.now();
    await sendBatch("flush", batch);
    flushingRef.current = false;
  }, [active, sendBatch]);

  const push = useCallback((ev: Omit<TelemetryEvent, "t_ms">) => {
    if (!active) return;
    const now = Date.now();
    if (!startTimeRef.current) startTimeRef.current = now;
    bufferRef.current.push({ ...ev, t_ms: now - startTimeRef.current });
    if (bufferRef.current.length >= MAX_BUFFER) void flush();
  }, [active, flush]);

  // timer de flush
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => { void flush(); }, FLUSH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active, flush]);

  // window listeners: focus, blur, paste
  useEffect(() => {
    if (!active) return;
    const onFocus = () => push({ event_type: "focus" });
    const onBlur = () => push({ event_type: "blur" });
    const onPaste = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? null;
      push({ event_type: "paste", meta: { tag } });
    };
    const onBeforeUnload = () => {
      if (bufferRef.current.length) {
        const batch = bufferRef.current.splice(0, bufferRef.current.length);
        // fire-and-forget via sendBeacon
        if (ingestUrl && sessionToken && instrument && typeof navigator.sendBeacon === "function") {
          const payload = {
            session_token: sessionToken,
            mode: "flush",
            instrument,
            company_id: companyId,
            round_no: roundNo,
            device: deviceRef.current,
            events: batch,
          };
          navigator.sendBeacon(
            ingestUrl,
            new Blob([JSON.stringify(payload)], { type: "application/json" }),
          );
        }
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("paste", onPaste, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("paste", onPaste, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [active, push, ingestUrl, sessionToken, instrument, companyId, roundNo]);

  // API pública
  const logView = useCallback((itemIndex: number) => {
    push({ event_type: "view", item_index: itemIndex });
  }, [push]);

  const logAnswer = useCallback((itemIndex: number, value: number | string) => {
    push({ event_type: "change", item_index: itemIndex, value });
  }, [push]);

  const logCustom = useCallback((
    event_type: TelemetryEvent["event_type"],
    meta?: Record<string, unknown>,
  ) => {
    push({ event_type, meta });
  }, [push]);

  const logSubmit = useCallback(async () => {
    if (!active) return;
    // flush pendentes + envia submit final para acionar cálculo do score
    const pending = bufferRef.current.splice(0, bufferRef.current.length);
    pending.push({
      event_type: "submit",
      t_ms: Date.now() - (startTimeRef.current || Date.now()),
    });
    await sendBatch("submit", pending);
  }, [active, sendBatch]);

  return { logView, logAnswer, logSubmit, logCustom, flush };
}
