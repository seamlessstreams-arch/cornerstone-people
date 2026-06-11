-- CreateTable
CREATE TABLE "QualificationRecord" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "certificateSeen" BOOLEAN NOT NULL DEFAULT false,
    "verifiedWithIssuer" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT,
    "awardedOn" TIMESTAMP(3),
    "expiresOn" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QualificationRecord_caseId_idx" ON "QualificationRecord"("caseId");

-- AddForeignKey
ALTER TABLE "QualificationRecord" ADD CONSTRAINT "QualificationRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
