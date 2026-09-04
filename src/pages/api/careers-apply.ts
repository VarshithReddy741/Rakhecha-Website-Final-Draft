import type { APIRoute } from "astro";
import { z } from "zod";
import { db } from "../../lib/db";
import { uploadFile, getSignedDownloadUrl } from "../../lib/storage";
import { sendCareersNotification } from "../../lib/email";
import crypto from "node:crypto";

export const prerender = false;

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const careersApplySchema = z.object({
  jobId: z.string().trim().min(1),
  jobTitle: z.string().trim().min(1),
  firstName: z.string().trim().min(1, "Enter your first name").max(100),
  lastName: z.string().trim().min(1, "Enter your last name").max(100),
  countryCode: z.string().trim().min(1).default("+91"),
  contactNumber: z.string().trim().min(7, "Enter a valid contact number").max(20),
  email: z.email("Enter a valid email address").trim(),
  currentLocation: z.enum(["kolkata", "mumbai", "delhi", "bangalore", "other"], {
    message: "Select your current location",
  }),
  isFresher: z.literal("on").optional(),
  experienceYears: z.string().trim().optional().default(""),
  experienceMonths: z.string().trim().optional().default(""),
  currentCtc: z.string().trim().max(50).optional().default(""),
  expectedCtc: z.string().trim().max(50).optional().default(""),
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
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ success: false, errors: { _form: "Invalid form submission." } }, 400);
  }

  const fields = Object.fromEntries(
    Array.from(formData.keys())
      .filter((k) => k !== "resume")
      .map((k) => [k, formData.get(k)]),
  );

  const result = careersApplySchema.safeParse(fields);
  const resumeFile = formData.get("resume");
  const resumeError = validateResume(resumeFile);

  if (!result.success || resumeError) {
    const errors = result.success ? {} : flattenErrors(result.error);
    if (resumeError) errors.resume = resumeError;
    return json({ success: false, errors }, 400);
  }

  const file = resumeFile as File;
  const submissionId = crypto.randomUUID();
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const resumeKey = "resumes/" + submissionId + ext;

  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    await uploadFile(
      resumeKey,
      Buffer.from(await file.arrayBuffer()),
      file.type || "application/octet-stream",
      file.name,
    );

    const row = await db.jobApplication.create({
      data: {
        jobId: result.data.jobId,
        jobTitleSnapshot: result.data.jobTitle,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        countryCode: result.data.countryCode,
        contactNumber: result.data.contactNumber,
        email: result.data.email,
        currentLocation: result.data.currentLocation,
        isFresher: result.data.isFresher === "on",
        experienceYears: result.data.experienceYears ?? "",
        experienceMonths: result.data.experienceMonths ?? "",
        currentCtc: result.data.currentCtc ?? "",
        expectedCtc: result.data.expectedCtc ?? "",
        resumeKey,
        resumeFileName: file.name,
        consentGiven: true,
        ipHash: hashIp(rawIp),
        submissionId,
      },
    });

    const resumeSignedUrl = await getSignedDownloadUrl(resumeKey, 3600);

    sendCareersNotification({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      contactNumber: row.contactNumber,
      jobTitleSnapshot: row.jobTitleSnapshot,
      jobId: row.jobId,
      resumeSignedUrl,
      submittedAt: row.submittedAt.toISOString(),
    }).catch((err) => console.error("[careers-apply] Email failed:", err));

    return json({ success: true });
  } catch (err) {
    console.error("[careers-apply] Submission failed:", err);
    return json(
      { success: false, errors: { _form: "We couldn't submit your application. Please try again." } },
      500,
    );
  }
};

function validateResume(value: FormDataEntryValue | null): string | null {
  if (!value || typeof value === "string") return "Attach your resume.";
  const ext = value.name.slice(value.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return "Resume must be a .pdf, .doc, or .docx file.";
  if (value.type !== "" && !ALLOWED_MIME_TYPES.has(value.type))
    return "Resume must be a .pdf, .doc, or .docx file.";
  if (value.size === 0) return "Attach your resume.";
  if (value.size > MAX_RESUME_BYTES) return "Resume must be 5MB or smaller.";
  return null;
}

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
