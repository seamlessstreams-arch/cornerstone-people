-- CreateTable
CREATE TABLE "TalentProspect" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT,
    "note" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentProspect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TalentProspect_employerId_idx" ON "TalentProspect"("employerId");

-- AddForeignKey
ALTER TABLE "TalentProspect" ADD CONSTRAINT "TalentProspect_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
