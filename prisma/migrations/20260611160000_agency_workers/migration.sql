-- CreateTable
CREATE TABLE "AgencyWorker" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "agencyName" TEXT,
    "role" TEXT,
    "agencyChecksConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "agencyConfirmationRef" TEXT,
    "identitySeenOnArrival" BOOLEAN NOT NULL DEFAULT false,
    "dbsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "referencesConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "rightToWorkConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "soleChargeApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyWorker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencyWorker_employerId_idx" ON "AgencyWorker"("employerId");

-- AddForeignKey
ALTER TABLE "AgencyWorker" ADD CONSTRAINT "AgencyWorker_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
