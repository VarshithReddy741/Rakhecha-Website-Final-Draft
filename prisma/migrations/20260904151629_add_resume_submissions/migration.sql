-- CreateTable
CREATE TABLE "resume_submissions" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "areaOfInterest" TEXT NOT NULL,
    "resumeKey" TEXT NOT NULL,
    "resumeFileName" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "ipHash" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedAt" TIMESTAMP(3),

    CONSTRAINT "resume_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resume_submissions_submissionId_key" ON "resume_submissions"("submissionId");
