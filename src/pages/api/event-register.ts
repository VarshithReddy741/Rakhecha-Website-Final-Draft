import type { APIRoute } from "astro";
import { z } from "zod";
import { db } from "../../lib/db";
import { sendEventRegistrationNotification } from "../../lib/email";
import crypto from "node:crypto";

export const prerender = false;

const eventRegisterSchema = z.object({
  eventId: z.string().trim().min(1),
  eventTitle: z.string().trim().min(1),
  fullName: z.string().trim().min(2, "Enter your full name").max(200),
  email: z.email("Enter a valid email address").trim(),
  contactNumber: z.string().trim().max(20).optional().default(""),
  currentLocation: z.string().trim().min(1, "Enter your city or location").max(200),
  investorCategory: z.enum(
    ["institutional_investor", "family_office", "hnwi", "financial_advisor"],
    { message: "Select an investor category" },
  ),
  referralSource: z.string().trim().max(100).optional().default(""),
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

  const result = eventRegisterSchema.safeParse(body);
  if (!result.success) {
    return json({ success: false, errors: flattenErrors(result.error) }, 400);
  }

  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    const row = await db.eventRegistration.create({
      data: {
        eventId: result.data.eventId,
        eventTitleSnapshot: result.data.eventTitle,
        fullName: result.data.fullName,
        email: result.data.email,
        contactNumber: result.data.contactNumber ?? "",
        currentLocation: result.data.currentLocation,
        investorCategory: result.data.investorCategory,
        referralSource: result.data.referralSource ?? "",
        consentGiven: true,
        ipHash: hashIp(rawIp),
      },
    });

    try {
      await sendEventRegistrationNotification({
        fullName: row.fullName,
        email: row.email,
        contactNumber: row.contactNumber,
        currentLocation: row.currentLocation,
        investorCategory: row.investorCategory,
        eventTitleSnapshot: row.eventTitleSnapshot,
        submittedAt: row.submittedAt.toISOString(),
      });
    } catch (err) {
      console.error("[event-register] Email failed:", err);
    }

    return json({ success: true });
  } catch (err) {
    console.error("[event-register] Submission failed:", err);
    return json(
      { success: false, errors: { _form: "We couldn't submit your registration. Please try again." } },
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
