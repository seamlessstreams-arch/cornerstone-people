-- CreateTable
CREATE TABLE "SaferRecruitmentCase" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'APPLICATION_RECEIVED',
    "notes" TEXT,
    "clearedToStartBy" TEXT,
    "clearedToStartAt" TIMESTAMP(3),
    "decisionBy" TEXT,
    "decisionAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaferRecruitmentCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceBankEntry" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "organisationName" TEXT NOT NULL,
    "organisationType" TEXT,
    "hrEmail" TEXT,
    "hrPhone" TEXT,
    "portalLink" TEXT,
    "refereeName" TEXT,
    "refereeRole" TEXT,
    "refereeEmail" TEXT,
    "refereePhone" TEXT,
    "address" TEXT,
    "preferredMethod" TEXT,
    "consentFormRequired" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerificationAccepted" BOOLEAN NOT NULL DEFAULT false,
    "factualOnly" BOOLEAN NOT NULL DEFAULT false,
    "providesSafeguardingComment" BOOLEAN NOT NULL DEFAULT false,
    "documentsRequired" TEXT,
    "chasePattern" TEXT,
    "averageResponseDays" INTEGER,
    "reliabilityRating" INTEGER,
    "lastUsedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceBankEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceRequest" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "bankEntryId" TEXT,
    "referenceType" TEXT NOT NULL,
    "refereeName" TEXT NOT NULL,
    "refereeEmail" TEXT,
    "refereeOrg" TEXT,
    "method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "consentRecorded" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "chaser1At" TIMESTAMP(3),
    "chaser2At" TIMESTAMP(3),
    "finalChaserAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "verbalVerifiedBy" TEXT,
    "verbalVerifiedAt" TIMESTAMP(3),
    "responseText" TEXT,
    "qualityStatus" TEXT,
    "qualityNotes" TEXT,
    "disposition" TEXT,
    "concernFlag" BOOLEAN NOT NULL DEFAULT false,
    "rmReviewRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentGapReview" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "findings" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_EXPLANATION',
    "managerNotes" TEXT,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentGapReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbsCheck" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" TEXT,
    "certificateDate" TIMESTAMP(3),
    "level" TEXT,
    "workforceType" TEXT,
    "barredListChecked" BOOLEAN NOT NULL DEFAULT false,
    "updateService" BOOLEAN NOT NULL DEFAULT false,
    "updateServiceConsent" BOOLEAN NOT NULL DEFAULT false,
    "dateChecked" TIMESTAMP(3),
    "certificateSeen" BOOLEAN NOT NULL DEFAULT false,
    "riskReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "checkedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DbsCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "summary" TEXT,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaferRecruitmentCase_matchId_key" ON "SaferRecruitmentCase"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentGapReview_caseId_key" ON "EmploymentGapReview"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "DbsCheck_caseId_key" ON "DbsCheck"("caseId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "SaferRecruitmentCase" ADD CONSTRAINT "SaferRecruitmentCase_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaferRecruitmentCase" ADD CONSTRAINT "SaferRecruitmentCase_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaferRecruitmentCase" ADD CONSTRAINT "SaferRecruitmentCase_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceBankEntry" ADD CONSTRAINT "ReferenceBankEntry_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceRequest" ADD CONSTRAINT "ReferenceRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceRequest" ADD CONSTRAINT "ReferenceRequest_bankEntryId_fkey" FOREIGN KEY ("bankEntryId") REFERENCES "ReferenceBankEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentGapReview" ADD CONSTRAINT "EmploymentGapReview_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DbsCheck" ADD CONSTRAINT "DbsCheck_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
