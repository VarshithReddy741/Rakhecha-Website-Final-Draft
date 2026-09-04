import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resend } from "resend";
import ExcelJS from "exceljs";

const db = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@rakhechafinserv.com";
const BUCKET = process.env.S3_BUCKET_NAME!;

function s3() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: "when_required",
    responseChecksumValidation: "when_required",
  });
}

function toList(env: string | undefined, fallback: string) {
  return (env ?? fallback).split(",").map((e) => e.trim()).filter(Boolean);
}

async function run() {
  const exportDate = new Date().toISOString().slice(0, 10);

  const [contacts, applications] = await Promise.all([
    db.contactSubmission.findMany({ where: { exportedAt: null } }),
    db.jobApplication.findMany({ where: { exportedAt: null } }),
  ]);

  if (!contacts.length && !applications.length) {
    console.log("[export] " + exportDate + ": No new submissions.");
    return;
  }

  const wb = new ExcelJS.Workbook();

  if (contacts.length) {
    const ws = wb.addWorksheet("Consultation Requests");
    ws.columns = [
      { header: "ID", key: "id" },
      { header: "Name", key: "fullName" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "contactNumber" },
      { header: "Service", key: "serviceSelection" },
      { header: "Message", key: "queryDetails" },
      { header: "Submitted At", key: "submittedAt" },
    ];
    contacts.forEach((c) => ws.addRow({ ...c, submittedAt: c.submittedAt.toISOString() }));
  }

  if (applications.length) {
    const ws = wb.addWorksheet("Job Applications");
    ws.columns = [
      { header: "Submission ID", key: "submissionId" },
      { header: "First Name", key: "firstName" },
      { header: "Last Name", key: "lastName" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "contactNumber" },
      { header: "Job Title", key: "jobTitleSnapshot" },
      { header: "Job ID", key: "jobId" },
      { header: "Location", key: "currentLocation" },
      { header: "Fresher", key: "isFresher" },
      { header: "Exp Years", key: "experienceYears" },
      { header: "Current CTC", key: "currentCtc" },
      { header: "Expected CTC", key: "expectedCtc" },
      { header: "Submitted At", key: "submittedAt" },
    ];
    applications.forEach((a) =>
      ws.addRow({ ...a, isFresher: a.isFresher ? "Yes" : "No", submittedAt: a.submittedAt.toISOString() }),
    );
  }

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  const exportKey = "exports/leads-" + exportDate + ".xlsx";
  const store = s3();

  await store.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: exportKey,
      Body: buffer,
      ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );

  const signedUrl = await getSignedUrl(
    store,
    new GetObjectCommand({ Bucket: BUCKET, Key: exportKey }),
    { expiresIn: 86400 },
  );
  const expiresAt = new Date(Date.now() + 86400 * 1000).toUTCString();

  await resend.emails.send({
    from: FROM,
    to: toList(process.env.EMAIL_EXPORT_RECIPIENTS, "admin@rakhechafinserv.com"),
    subject: "Daily Lead Export — " + exportDate,
    html:
      "<h2>Daily Lead Export — " + exportDate + "</h2>" +
      "<p><b>" + contacts.length + "</b> consultation request(s)</p>" +
      "<p><b>" + applications.length + "</b> job application(s)</p>" +
      "<p><a href='" + signedUrl + "'><b>Download Export (XLSX)</b></a></p>" +
      "<p style='font-size:11px;color:#888'>Expires: " + expiresAt + ". Do not forward.</p>",
  });

  const now = new Date();
  await Promise.all([
    contacts.length &&
      db.contactSubmission.updateMany({
        where: { id: { in: contacts.map((c) => c.id) } },
        data: { exportedAt: now },
      }),
    applications.length &&
      db.jobApplication.updateMany({
        where: { id: { in: applications.map((a) => a.id) } },
        data: { exportedAt: now },
      }),
  ]);

  console.log("[export] " + exportDate + ": " + contacts.length + " contacts, " + applications.length + " applications exported.");
}

run()
  .catch((err) => { console.error("[export] Fatal:", err); process.exit(1); })
  .finally(() => db.$disconnect());
