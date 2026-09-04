import { defineMiddleware } from "astro:middleware";
import crypto from "node:crypto";

const GUARDED = new Set(["/api/contact", "/api/careers-apply"]);
const WINDOW_MS = 10 * 60 * 1000;
const MAX = 5;
const store = new Map<string, { count: number; windowStart: number }>();

function hashIp(ip: string): string {
  return crypto
    .createHmac("sha256", process.env.IP_HASH_SALT ?? "rakhecha-default-salt")
    .update(ip)
    .digest("hex")
    .slice(0, 16);
}

export const onRequest = defineMiddleware(async ({ request }, next) => {
  const { pathname } = new URL(request.url);
  if (request.method !== "POST" || !GUARDED.has(pathname)) return next();

  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const key = hashIp(rawIp);
  const now = Date.now();
  const entry = store.get(key);

  if (entry && now - entry.windowStart < WINDOW_MS) {
    if (entry.count >= MAX) {
      const retryAfter = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
      return new Response(
        JSON.stringify({
          success: false,
          errors: { _form: "Too many requests. Please try again in a few minutes." },
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
        },
      );
    }
    entry.count++;
  } else {
    store.set(key, { count: 1, windowStart: now });
  }

  return next();
});
