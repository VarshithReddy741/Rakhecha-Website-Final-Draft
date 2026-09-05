import type { APIRoute } from "astro";
import { z } from "zod";
import { db } from "../../lib/db";
import { Prisma } from "@prisma/client";
import crypto from "node:crypto";

export const prerender = false;

const subscribeSchema = z.object({
  email: z.email("Enter a valid email address").trim(),
});

function hashIp(ip: string): string {
  return crypto
    .createHmac("sha256", process.env.IP_HASH_SALT ?? "rakhecha-default-salt")
    .update(ip)
    .digest("hex")
    .slice(0, 16);
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, errors: { _form: "Invalid request body." } }, 400);
  }

  const result = subscribeSchema.safeParse(body);
  if (!result.success) {
    return json({ success: false, errors: flattenErrors(result.error) }, 400);
  }

  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    await db.newsletterSubscription.create({
      data: {
        email: result.data.email,
        ipHash: hashIp(rawIp),
      },
    });

    return json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return json({ success: true });
    }
    console.error("[newsletter-subscribe] DB insert failed:", err);
    return json(
      { success: false, errors: { _form: "We couldn't subscribe you. Please try again." } },
      500,
    );
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function flattenErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
