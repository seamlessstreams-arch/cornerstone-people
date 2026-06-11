-- CreateTable
CREATE TABLE "SelfDeclaration" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "publicToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "hasUnspentConvictions" BOOLEAN,
    "hasCautionsOrPending" BOOLEAN,
    "isBarred" BOOLEAN,
    "isDisqualified" BOOLEAN,
    "livedOverseas" BOOLEAN,
    "disclosureDetails" TEXT,
    "overseasDetails" TEXT,
    "declaredTruthful" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "submittedIp" TEXT,
    "submittedUserAgent" TEXT,
    "disclosureFlagged" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewOutcome" TEXT,
    "managerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelfDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SelfDeclaration_caseId_key" ON "SelfDeclaration"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "SelfDeclaration_publicToken_key" ON "SelfDeclaration"("publicToken");

-- AddForeignKey
ALTER TABLE "SelfDeclaration" ADD CONSTRAINT "SelfDeclaration_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
