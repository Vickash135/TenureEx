-- Adds independent normal-user accounts and direct-published listings without changing existing records.
ALTER TYPE "UserType" ADD VALUE IF NOT EXISTS 'NORMAL_USER';
ALTER TABLE "Property" ALTER COLUMN "landlordProfileId" DROP NOT NULL;
ALTER TABLE "Property" ADD COLUMN "marketplaceOwnerId" TEXT;
ALTER TABLE "Property" ADD COLUMN "contactName" TEXT;
ALTER TABLE "Property" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "Property" ADD COLUMN "contactPhone" TEXT;
CREATE INDEX "Property_marketplaceOwnerId_idx" ON "Property"("marketplaceOwnerId");
ALTER TABLE "Property" ADD CONSTRAINT "Property_marketplaceOwnerId_fkey" FOREIGN KEY ("marketplaceOwnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_owner_required_check" CHECK ("landlordProfileId" IS NOT NULL OR "marketplaceOwnerId" IS NOT NULL);
