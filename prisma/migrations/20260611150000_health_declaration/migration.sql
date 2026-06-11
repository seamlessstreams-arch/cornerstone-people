-- CreateTable
CREATE TABLE "HealthDeclaration" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "publicToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "fitForRole" BOOLEAN,
    "conditionsAffectingRole" BOOLEAN,
    "conditionsDetail" TEXT,
    "reasonableAdjustmentsNeeded" BOOLEAN,
    "adjustmentsDetail" TEXT,
    "declaredTruthful" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "submittedIp" TEXT,
    "submittedUserAgent" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "fitnessOutcome" TEXT,
    "managerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthDeclaration_caseId_key" ON "HealthDeclaration"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthDeclaration_publicToken_key" ON "HealthDeclaration"("publicToken");

-- AddForeignKey
ALTER TABLE "HealthDeclaration" ADD CONSTRAINT "HealthDeclaration_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
