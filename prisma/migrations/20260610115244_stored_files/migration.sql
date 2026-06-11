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

-- CreateIndex
CREATE INDEX "StoredFile_candidateId_idx" ON "StoredFile"("candidateId");

-- CreateIndex
CREATE INDEX "StoredFile_caseId_idx" ON "StoredFile"("caseId");

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SaferRecruitmentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
