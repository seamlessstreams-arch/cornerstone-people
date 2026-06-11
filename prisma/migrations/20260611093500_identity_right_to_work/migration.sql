-- CreateTable
CREATE TABLE "IdentityRightToWorkCheck" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "identityDocumentType" TEXT,
    "identityDocumentSeen" BOOLEAN NOT NULL DEFAULT false,
    "photographSeen" BOOLEAN NOT NULL DEFAULT false,
    "likenessConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "nameDiscrepancyExplained" BOOLEAN NOT NULL DEFAULT false,
    "rightToWorkVerified" BOOLEAN NOT NULL DEFAULT false,
    "rightToWorkMethod" TEXT,
    "shareCode" TEXT,
    "timeLimited" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityRightToWorkCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityRightToWorkCheck_caseId_key" ON "IdentityRightToWorkCheck"("caseId");

-- AddForeignKey
ALTER TABLE "IdentityRightToWorkCheck" ADD CONSTRAINT "IdentityRightToWorkCheck_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
