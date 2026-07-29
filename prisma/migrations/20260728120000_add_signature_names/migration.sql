-- Store the name manually typed by the signer alongside the signature image.
ALTER TABLE "Assignment"
  ADD COLUMN "employeeSignatureName" TEXT,
  ADD COLUMN "managerSignatureName"  TEXT,
  ADD COLUMN "hrSignatureName"       TEXT;
