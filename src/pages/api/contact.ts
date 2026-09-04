import type { APIRoute } from "astro";
import { z } from "zod";
import { db } from "../../lib/db";
import { sendContactNotification } from "../../lib/email";
import crypto from "node:crypto";

export const prerender = false;

const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(200),
  serviceSelection: z.enum(["investment_banking", "wealth_management", "insurance"], {
    message: "Select a service",
  }),
  contactNumber: z.string().trim().min(7, "Enter a valid contact number").max(20),
  email: z.email("Enter a valid email address").trim(),
  queryDetails: z.string().trim().max(2000).optional().default(""),
  consentGiven: z
    .unknown()
    .refine((v) => v === "on" || v === true, {
      message: "You must accept the privacy policy to proceed.",
    }),
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

  const result = contactSchema.safeParse(body);
  if (!result.success) {
    return json({ success: false, errors: flattenErrors(result.error) }, 400);
  }

  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    const row = await db.contactSubmission.create({
      data: {
        fullName: result.data.fullName,
        serviceSelection: result.data.serviceSelection,
        contactNumber: result.data.contactNumber,
        email: result.data.email,
        queryDetails: result.data.queryDetails,
        consentGiven: true,
        ipHash: hashIp(rawIp),
      },
    });

    try {
      await sendContactNotification({
        fullName: row.fullName,
        email: row.email,
        contactNumber: row.contactNumber,
        serviceSelection: row.serviceSelection,
        queryDetails: row.queryDetails,
        submittedAt: row.submittedAt.toISOString(),
      });
    } catch (err) {
      console.error("[contact] Email failed:", err);
    }

    return json({ success: true });
  } catch (err) {
    console.error("[contact] DB insert failed:", err);
    return json(
      { success: false, errors: { _form: "We couldn't save your request. Please try again." } },
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
