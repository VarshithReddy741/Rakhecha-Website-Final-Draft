import type { APIRoute } from "astro";

// Smoke-test route only, to confirm the Node adapter serves non-prerendered
// API routes correctly. Prompt 6 replaces this with the real form routes.
export const prerender = false;

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
