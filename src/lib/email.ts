import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@rakhechafinserv.com";

function toList(env: string | undefined, fallback: string): string[] {
  return (env ?? fallback).split(",").map((e) => e.trim()).filter(Boolean);
}

const SERVICE_LABELS: Record<string, string> = {
  investment_banking: "Investment Banking",
  wealth_management: "Wealth Management",
  insurance: "Insurance",
};

export async function sendContactNotification(data: {
  fullName: string;
  email: string;
  contactNumber: string;
  serviceSelection: string;
  queryDetails: string;
  submittedAt: string;
}): Promise<void> {
  const team = toList(process.env.EMAIL_INTERNAL_TEAM, "team@rakhechafinserv.com");
  const label = SERVICE_LABELS[data.serviceSelection] ?? data.serviceSelection;
  await Promise.all([
    resend.emails.send({
      from: FROM,
      to: team,
      subject: "New Consultation Request — " + label,
      html:
        "<h2>New Consultation Inquiry</h2><table cellpadding='6'>" +
        "<tr><td><b>Name</b></td><td>" + data.fullName + "</td></tr>" +
        "<tr><td><b>Service</b></td><td>" + label + "</td></tr>" +
        "<tr><td><b>Email</b></td><td>" + data.email + "</td></tr>" +
        "<tr><td><b>Phone</b></td><td>" + data.contactNumber + "</td></tr>" +
        "<tr><td><b>Message</b></td><td>" + (data.queryDetails || "—") + "</td></tr>" +
        "<tr><td><b>Submitted</b></td><td>" + data.submittedAt + "</td></tr>" +
        "</table>",
    }),
    resend.emails.send({
      from: FROM,
      to: [data.email],
      subject: "We've received your inquiry — Rakhecha Finserv",
      html:
        "<p>Dear " + data.fullName + ",</p>" +
        "<p>Thank you for reaching out to Rakhecha Finserv regarding <b>" + label + "</b>.</p>" +
        "<p>One of our advisors will be in touch with you shortly.</p>" +
        "<p>Best regards,<br/><b>Rakhecha Finserv Team</b></p>",
    }),
  ]);
}

export async function sendCareersNotification(data: {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  jobTitleSnapshot: string;
  jobId: string;
  resumeSignedUrl: string;
  submittedAt: string;
}): Promise<void> {
  const ta = toList(
    process.env.EMAIL_INTERNAL_TA ?? process.env.EMAIL_INTERNAL_TEAM,
    "team@rakhechafinserv.com",
  );
  await Promise.all([
    resend.emails.send({
      from: FROM,
      to: ta,
      subject: "New Application — " + data.jobTitleSnapshot + " (" + data.jobId + ")",
      html:
        "<h2>New Job Application</h2><table cellpadding='6'>" +
        "<tr><td><b>Name</b></td><td>" + data.firstName + " " + data.lastName + "</td></tr>" +
        "<tr><td><b>Role</b></td><td>" + data.jobTitleSnapshot + "</td></tr>" +
        "<tr><td><b>Job ID</b></td><td>" + data.jobId + "</td></tr>" +
        "<tr><td><b>Email</b></td><td>" + data.email + "</td></tr>" +
        "<tr><td><b>Phone</b></td><td>" + data.contactNumber + "</td></tr>" +
        "<tr><td><b>Submitted</b></td><td>" + data.submittedAt + "</td></tr>" +
        "</table>" +
        "<p><a href='" + data.resumeSignedUrl + "'>Download Resume (1hr link)</a></p>" +
        "<p style='font-size:11px;color:#888'>Do not forward — signed URL contains credentials.</p>",
    }),
    resend.emails.send({
      from: FROM,
      to: [data.email],
      subject: "Application Received — Rakhecha Finserv",
      html:
        "<p>Dear " + data.firstName + ",</p>" +
        "<p>Thank you for applying for <b>" + data.jobTitleSnapshot + "</b> at Rakhecha Finserv.</p>" +
        "<p>Our talent acquisition team will review your application and be in touch if your profile is a match.</p>" +
        "<p>Best regards,<br/><b>Rakhecha Finserv Team</b></p>",
    }),
  ]);
}

export async function sendResumeNotification(data: {
  fullName: string;
  email: string;
  areaOfInterest: string;
  resumeSignedUrl: string;
  submittedAt: string;
}): Promise<void> {
  const ta = toList(
    process.env.EMAIL_INTERNAL_TA ?? process.env.EMAIL_INTERNAL_TEAM,
    "team@rakhechafinserv.com",
  );
  await Promise.all([
    resend.emails.send({
      from: FROM,
      to: ta,
      subject: "New Resume Submission — " + data.areaOfInterest,
      html:
        "<h2>New General Resume Submission</h2><table cellpadding='6'>" +
        "<tr><td><b>Name</b></td><td>" + data.fullName + "</td></tr>" +
        "<tr><td><b>Area of Interest</b></td><td>" + data.areaOfInterest + "</td></tr>" +
        "<tr><td><b>Email</b></td><td>" + data.email + "</td></tr>" +
        "<tr><td><b>Submitted</b></td><td>" + data.submittedAt + "</td></tr>" +
        "</table>" +
        "<p><a href='" + data.resumeSignedUrl + "'>Download Resume (1hr link)</a></p>" +
        "<p style='font-size:11px;color:#888'>Do not forward — signed URL contains credentials.</p>",
    }),
    resend.emails.send({
      from: FROM,
      to: [data.email],
      subject: "Resume Received — Rakhecha Finserv",
      html:
        "<p>Dear " + data.fullName + ",</p>" +
        "<p>Thank you for sharing your resume with Rakhecha Finserv. We'll keep it on file and reach out if a role matching your interest in <b>" + data.areaOfInterest + "</b> opens up.</p>" +
        "<p>Best regards,<br/><b>Rakhecha Finserv Team</b></p>",
    }),
  ]);
}
