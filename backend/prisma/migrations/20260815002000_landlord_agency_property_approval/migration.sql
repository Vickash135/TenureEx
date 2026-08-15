ALTER TABLE "LandlordProfile"
ADD COLUMN "agencyId" TEXT;

CREATE INDEX "LandlordProfile_agencyId_idx"
ON "LandlordProfile"("agencyId");

ALTER TABLE "LandlordProfile"
ADD CONSTRAINT "LandlordProfile_agencyId_fkey"
FOREIGN KEY ("agencyId") REFERENCES "Agency"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LandlordInvitation" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LandlordInvitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LandlordInvitation_agencyId_idx" ON "LandlordInvitation"("agencyId");
CREATE INDEX "LandlordInvitation_email_idx" ON "LandlordInvitation"("email");
CREATE INDEX "LandlordInvitation_status_idx" ON "LandlordInvitation"("status");
CREATE INDEX "LandlordInvitation_expiresAt_idx" ON "LandlordInvitation"("expiresAt");

ALTER TABLE "LandlordInvitation"
ADD CONSTRAINT "LandlordInvitation_agencyId_fkey"
FOREIGN KEY ("agencyId") REFERENCES "Agency"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
