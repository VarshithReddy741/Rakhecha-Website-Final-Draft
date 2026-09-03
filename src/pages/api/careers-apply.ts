import type { APIRoute } from "astro";
import { z } from "zod";
import { appendLocalSubmission, saveLocalUpload } from "../../lib/local-store";

export const prerender = false;

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];
const ALLOWED_RESUME_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// Matches the fields collected by the application form on
// /careers/apply/ (careers/apply.astro) — see the `name` attributes there.
// `jobId`/`jobTitle` are hidden fields carrying the page's (currently
// hardcoded) single job, so a submission can still be traced to a role.
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
});

export const POST: APIRoute = async ({ request }) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ success: false, errors: { _form: "Invalid form submission." } }, 400);
  }

  const fields = Object.fromEntries(
    Array.from(formData.keys())
      .filter((key) => key !== "resume")
      .map((key) => [key, formData.get(key)]),
  );

  const result = careersApplySchema.safeParse(fields);
  const resume = formData.get("resume");
  const resumeError = validateResume(resume);

  if (!result.success || resumeError) {
    const errors = result.success ? {} : flattenZodErrors(result.error);
    if (resumeError) errors.resume = resumeError;
    return jsonResponse({ success: false, errors }, 400);
  }

  const resumeFile = resume as File;
  const submissionId = crypto.randomUUID();
  const safeName = resumeFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storedFileName = `${submissionId}-${safeName}`;

  // TODO(backend phase): replace this local-disk write with an upload to the
  // real object store (S3/R2) and persist the resulting object key/URL (not
  // raw bytes) on the application record in Postgres.
  await saveLocalUpload("careers-resumes.local", storedFileName, resumeFile);

  const submission = {
    ...result.data,
    isFresher: result.data.isFresher === "on",
    submissionId,
    resumeFileName: resumeFile.name,
    resumeStoredAs: storedFileName,
    submittedAt: new Date().toISOString(),
  };

  console.log("[careers-apply] New application:", submission);

  // TODO(backend phase): replace this local JSON append with:
  //   1. INSERT into Postgres `job_applications` (submission above, with resumeStoredAs -> the real object key from the S3/R2 upload)
  //   2. Internal notification to talent acquisition
  //   3. ATS/CRM sync
  await appendLocalSubmission("careers-submissions.local.json", submission);

  return jsonResponse({ success: true });
};

function validateResume(value: FormDataEntryValue | null): string | null {
  if (!value || typeof value === "string") return "Attach your resume.";
  const file = value;
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const hasAllowedExtension = ALLOWED_RESUME_EXTENSIONS.includes(extension);
  const hasAllowedMimeType = file.type === "" || ALLOWED_RESUME_MIME_TYPES.has(file.type);
  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return "Resume must be a .pdf, .doc, or .docx file.";
  }
  if (file.size === 0) {
    return "Attach your resume.";
  }
  if (file.size > MAX_RESUME_BYTES) {
    return "Resume must be 5MB or smaller.";
  }
  return null;
}

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
