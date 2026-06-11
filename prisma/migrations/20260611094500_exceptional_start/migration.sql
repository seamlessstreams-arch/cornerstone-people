-- CreateTable
CREATE TABLE "ExceptionalStartAssessment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "businessReason" TEXT,
    "outstandingChecks" TEXT,
    "riskLevel" TEXT,
    "riskMitigation" TEXT,
    "supervisorName" TEXT,
    "noSoleCharge" BOOLEAN NOT NULL DEFAULT false,
    "noUnsupervisedAccess" BOOLEAN NOT NULL DEFAULT false,
    "noIntimateCare" BOOLEAN NOT NULL DEFAULT false,
    "noOvernight" BOOLEAN NOT NULL DEFAULT false,
    "supervisionNotes" TEXT,
    "reviewDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExceptionalStartAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExceptionalStartAssessment_caseId_key" ON "ExceptionalStartAssessment"("caseId");

-- AddForeignKey
ALTER TABLE "ExceptionalStartAssessment" ADD CONSTRAINT "ExceptionalStartAssessment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
