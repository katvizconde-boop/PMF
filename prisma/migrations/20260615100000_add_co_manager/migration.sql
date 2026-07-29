-- CreateTable
CREATE TABLE "CoManager" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoManager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoManager_employeeId_managerId_key" ON "CoManager"("employeeId", "managerId");
CREATE INDEX "CoManager_managerId_idx" ON "CoManager"("managerId");

-- AddForeignKey
ALTER TABLE "CoManager" ADD CONSTRAINT "CoManager_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoManager" ADD CONSTRAINT "CoManager_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
