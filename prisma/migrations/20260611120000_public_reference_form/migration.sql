-- AlterTable
ALTER TABLE "ReferenceRequest" ADD COLUMN "publicToken" TEXT,
ADD COLUMN "tokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "submittedIp" TEXT,
ADD COLUMN "submittedUserAgent" TEXT,
ADD COLUMN "refereeJobTitle" TEXT,
ADD COLUMN "refereeAuthorisedConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "workedWithChildren" BOOLEAN,
ADD COLUMN "wouldReEmploy" BOOLEAN;

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceRequest_publicToken_key" ON "ReferenceRequest"("publicToken");
