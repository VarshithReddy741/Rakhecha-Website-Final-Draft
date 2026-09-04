-- CreateTable
CREATE TABLE "contact_submissions" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "serviceSelection" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "queryDetails" TEXT NOT NULL DEFAULT '',
    "consentGiven" BOOLEAN NOT NULL,
    "ipHash" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedAt" TIMESTAMP(3),

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitleSnapshot" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT '+91',
    "contactNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "currentLocation" TEXT NOT NULL,
    "isFresher" BOOLEAN NOT NULL DEFAULT false,
    "experienceYears" TEXT NOT NULL DEFAULT '',
    "experienceMonths" TEXT NOT NULL DEFAULT '',
    "currentCtc" TEXT NOT NULL DEFAULT '',
    "expectedCtc" TEXT NOT NULL DEFAULT '',
    "resumeKey" TEXT NOT NULL,
    "resumeFileName" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "ipHash" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedAt" TIMESTAMP(3),

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_submissionId_key" ON "job_applications"("submissionId");
