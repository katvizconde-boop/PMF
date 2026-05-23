-- CreateTable: CareerPath
CREATE TABLE "CareerPath" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CareerPathStep
CREATE TABLE "CareerPathStep" (
    "id" TEXT NOT NULL,
    "careerPathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "yearsTypical" TEXT,
    "skills" TEXT NOT NULL,
    "responsibilities" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CareerPathStep_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "CareerPathStep" ADD CONSTRAINT "CareerPathStep_careerPathId_fkey" FOREIGN KEY ("careerPathId") REFERENCES "CareerPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: UserCareerProgress
CREATE TABLE "UserCareerProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentPathId" TEXT,
    "currentStepId" TEXT,
    "targetStepId" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserCareerProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserCareerProgress_userId_key" ON "UserCareerProgress"("userId");
ALTER TABLE "UserCareerProgress" ADD CONSTRAINT "UserCareerProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCareerProgress" ADD CONSTRAINT "UserCareerProgress_currentPathId_fkey" FOREIGN KEY ("currentPathId") REFERENCES "CareerPath"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserCareerProgress" ADD CONSTRAINT "UserCareerProgress_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "CareerPathStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserCareerProgress" ADD CONSTRAINT "UserCareerProgress_targetStepId_fkey" FOREIGN KEY ("targetStepId") REFERENCES "CareerPathStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: Document
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Document_userId_type_idx" ON "Document"("userId", "type");
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
