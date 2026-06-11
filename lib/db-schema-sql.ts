// AUTO-GENERATED from keni-schema.sql — do not edit by hand.
// Embedded so the one-time provisioning endpoint ships in the serverless bundle.
export const KENI_SCHEMA_SQL = String.raw`-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visibilityMode" TEXT NOT NULL DEFAULT 'ANONYMOUS',
    "region" TEXT,
    "shiftPattern" TEXT,
    "youngPeopleType" TEXT,
    "experienceLevel" TEXT,
    "roleType" TEXT,
    "valuesTags" TEXT,
    "fullName" TEXT,
    "photoUrl" TEXT,
    "employmentHistory" TEXT,
    "narrative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "refereeName" TEXT NOT NULL,
    "refereeEmail" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "region" TEXT,
    "sellingPoints" TEXT,
    "ethos" TEXT,
    "childrenSupported" TEXT,
    "placementPicture" TEXT,
    "shiftPattern" TEXT,
    "supportOffered" TEXT,
    "compensation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "region" TEXT,
    "shiftPattern" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewRequestedBy" TEXT,
    "interviewRequestedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

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
    "publicToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "submittedIp" TEXT,
    "submittedUserAgent" TEXT,
    "refereeJobTitle" TEXT,
    "refereeAuthorisedConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "workedWithChildren" BOOLEAN,
    "wouldReEmploy" BOOLEAN,
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

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT,
    "size" INTEGER,
    "kind" TEXT,
    "candidateId" TEXT,
    "employerId" TEXT,
    "caseId" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentProspect" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT,
    "profileUrl" TEXT,
    "region" TEXT,
    "roleSought" TEXT,
    "experienceLevel" TEXT,
    "skills" TEXT,
    "summary" TEXT,
    "note" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentProspect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_userId_key" ON "Candidate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reference_token_key" ON "Reference"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_userId_key" ON "Employer"("userId");

-- CreateIndex
CREATE INDEX "AgencyWorker_employerId_idx" ON "AgencyWorker"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_candidateId_employerId_direction_key" ON "Interest"("candidateId", "employerId", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "Block_candidateId_employerId_key" ON "Block"("candidateId", "employerId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_candidateId_employerId_key" ON "Match"("candidateId", "employerId");

-- CreateIndex
CREATE UNIQUE INDEX "SaferRecruitmentCase_matchId_key" ON "SaferRecruitmentCase"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceRequest_publicToken_key" ON "ReferenceRequest"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentGapReview_caseId_key" ON "EmploymentGapReview"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "DbsCheck_caseId_key" ON "DbsCheck"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityRightToWorkCheck_caseId_key" ON "IdentityRightToWorkCheck"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "ExceptionalStartAssessment_caseId_key" ON "ExceptionalStartAssessment"("caseId");

-- CreateIndex
CREATE INDEX "QualificationRecord_caseId_idx" ON "QualificationRecord"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "SelfDeclaration_caseId_key" ON "SelfDeclaration"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "SelfDeclaration_publicToken_key" ON "SelfDeclaration"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "HealthDeclaration_caseId_key" ON "HealthDeclaration"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthDeclaration_publicToken_key" ON "HealthDeclaration"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "ShadowShift_caseId_key" ON "ShadowShift"("caseId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "StoredFile_candidateId_idx" ON "StoredFile"("candidateId");

-- CreateIndex
CREATE INDEX "StoredFile_caseId_idx" ON "StoredFile"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "TalentProspect_employerId_idx" ON "TalentProspect"("employerId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyWorker" ADD CONSTRAINT "AgencyWorker_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "IdentityRightToWorkCheck" ADD CONSTRAINT "IdentityRightToWorkCheck_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExceptionalStartAssessment" ADD CONSTRAINT "ExceptionalStartAssessment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationRecord" ADD CONSTRAINT "QualificationRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfDeclaration" ADD CONSTRAINT "SelfDeclaration_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthDeclaration" ADD CONSTRAINT "HealthDeclaration_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShadowShift" ADD CONSTRAINT "ShadowShift_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentProspect" ADD CONSTRAINT "TalentProspect_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

`;
