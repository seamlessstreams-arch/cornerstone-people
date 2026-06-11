-- CreateTable
CREATE TABLE "ShadowShift" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "shiftDate" TIMESTAMP(3),
    "supervisorName" TEXT,
    "riskAssessed" BOOLEAN NOT NULL DEFAULT false,
    "supervisedAtAllTimes" BOOLEAN NOT NULL DEFAULT false,
    "notCountedInStaffing" BOOLEAN NOT NULL DEFAULT false,
    "noAccessToChildInfo" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "authorisedBy" TEXT,
    "authorisedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShadowShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShadowShift_caseId_key" ON "ShadowShift"("caseId");

-- AddForeignKey
ALTER TABLE "ShadowShift" ADD CONSTRAINT "ShadowShift_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
