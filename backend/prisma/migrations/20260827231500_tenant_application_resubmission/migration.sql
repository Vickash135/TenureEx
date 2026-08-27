-- Add secure tenant resubmission fields without removing existing production data.
ALTER TABLE "TenantPropertyApplication"
  ADD COLUMN IF NOT EXISTS "moreInformationResponse" TEXT,
  ADD COLUMN IF NOT EXISTS "moreInformationTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "moreInformationTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resubmittedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "TenantPropertyApplication_moreInformationTokenHash_key"
  ON "TenantPropertyApplication"("moreInformationTokenHash");
