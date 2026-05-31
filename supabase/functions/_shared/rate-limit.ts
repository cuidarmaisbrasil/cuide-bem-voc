// Simple IP-based sliding window rate limiter backed by edge_rate_limits table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

/**
 * Returns true if the request is allowed, false if rate limited.
 * windowSeconds: bucket size in seconds. limit: max requests per IP per window.
 */
export async function checkRateLimit(
  endpoint: string,
  req: Request,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const ip = getClientIp(req);
    const ipHash = await sha256(ip + ":" + (Deno.env.get("SUPABASE_PROJECT_ID") || "salt"));
    const now = Date.now();
    const bucketMs = windowSeconds * 1000;
    const windowStart = new Date(Math.floor(now / bucketMs) * bucketMs).toISOString();

    const { data: existing } = await supabase
      .from("edge_rate_limits")
      .select("id,count")
      .eq("endpoint", endpoint)
      .eq("ip_hash", ipHash)
      .eq("window_start", windowStart)
      .maybeSingle();

    if (!existing) {
      await supabase
        .from("edge_rate_limits")
        .insert({ endpoint, ip_hash: ipHash, window_start: windowStart, count: 1 });
      return { allowed: true, retryAfter: 0 };
    }

    if (existing.count >= limit) {
      const retryAfter = Math.ceil(
        (Math.floor(now / bucketMs) * bucketMs + bucketMs - now) / 1000,
      );
      return { allowed: false, retryAfter };
    }

    await supabase
      .from("edge_rate_limits")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
    return { allowed: true, retryAfter: 0 };
  } catch (e) {
    console.error("rate-limit check failed", e);
    // Fail-open to avoid breaking legit traffic on storage errors.
    return { allowed: true, retryAfter: 0 };
  }
}
