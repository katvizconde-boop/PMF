-- AlterTable: Assignment
ALTER TABLE "Assignment" ADD COLUMN "employeeSignature" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "managerSignature" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "hrSignature" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "employeeSignedAt" TIMESTAMP(3);
ALTER TABLE "Assignment" ADD COLUMN "managerSignedAt" TIMESTAMP(3);
ALTER TABLE "Assignment" ADD COLUMN "hrSignedAt" TIMESTAMP(3);

-- AlterTable: Cycle
ALTER TABLE "Cycle" ADD COLUMN "autoAssignRegular" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Cycle" ADD COLUMN "autoAssignProbationary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Cycle" ADD COLUMN "regularTemplateId" TEXT;
ALTER TABLE "Cycle" ADD COLUMN "probationaryTemplateId" TEXT;

-- CreateTable: Goal
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "rating" DOUBLE PRECISION,
    "evidence" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_userId_cycleId_idx" ON "Goal"("userId", "cycleId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
