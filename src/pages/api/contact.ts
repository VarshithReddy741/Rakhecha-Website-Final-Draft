import type { APIRoute } from "astro";
import { z } from "zod";
import { appendLocalSubmission } from "../../lib/local-store";

export const prerender = false;

// Matches the fields collected by the "Book a Consultation" form on
// /contact-us/ (contact-us.astro) exactly — see the `name` attributes there.
const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(200),
  serviceSelection: z.enum(["investment_banking", "wealth_management", "insurance"], {
    message: "Select a service",
  }),
  contactNumber: z.string().trim().min(7, "Enter a valid contact number").max(20),
  email: z.email("Enter a valid email address").trim(),
  queryDetails: z.string().trim().max(2000).optional().default(""),
});

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, errors: { _form: "Invalid request body." } }, 400);
  }

  const result = contactSchema.safeParse(body);
  if (!result.success) {
    return jsonResponse({ success: false, errors: flattenZodErrors(result.error) }, 400);
  }

  const submission = {
    ...result.data,
    submittedAt: new Date().toISOString(),
  };

  console.log("[contact] New submission:", submission);

  // TODO(backend phase): replace this local JSON append with:
  //   1. INSERT into Postgres `contact_submissions` (result.data above maps 1:1 to columns)
  //   2. Internal notification (email/Slack) to the advisory team
  //   3. CRM sync (push the lead into whichever CRM the firm adopts)
  await appendLocalSubmission("contact-submissions.local.json", submission);

  return jsonResponse({ success: true });
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
