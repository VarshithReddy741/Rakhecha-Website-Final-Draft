-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventTitleSnapshot" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL DEFAULT '',
    "currentLocation" TEXT NOT NULL,
    "investorCategory" TEXT NOT NULL,
    "referralSource" TEXT NOT NULL DEFAULT '',
    "consentGiven" BOOLEAN NOT NULL,
    "ipHash" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedAt" TIMESTAMP(3),

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_submissionId_key" ON "event_registrations"("submissionId");
