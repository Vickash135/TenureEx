-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOUSE', 'FLAT', 'STUDIO', 'BUNGALOW', 'MAISONETTE', 'OTHER');

-- CreateEnum
CREATE TYPE "FurnishingStatus" AS ENUM ('FURNISHED', 'PART_FURNISHED', 'UNFURNISHED');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('OCCUPIED', 'VACANT', 'PENDING_APPROVAL');

-- CreateEnum
CREATE TYPE "PropertyApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MaintenanceRoute" AS ENUM ('CONTACT_LANDLORD_FIRST', 'AGENT_CAN_ARRANGE', 'USE_PREFERRED_CONTRACTOR');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "landlordProfileId" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "townCity" TEXT NOT NULL,
    "county" TEXT,
    "postcode" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "receptionRooms" INTEGER NOT NULL DEFAULT 0,
    "monthlyRent" DECIMAL(12,2) NOT NULL,
    "depositAmount" DECIMAL(12,2),
    "councilTaxBand" TEXT,
    "furnishingStatus" "FurnishingStatus" NOT NULL DEFAULT 'UNFURNISHED',
    "propertyStatus" "PropertyStatus" NOT NULL DEFAULT 'VACANT',
    "approvalStatus" "PropertyApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "tenantName" TEXT,
    "tenantEmail" TEXT,
    "tenantPhone" TEXT,
    "availableFrom" TIMESTAMP(3),
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "childrenAllowed" BOOLEAN NOT NULL DEFAULT true,
    "hasParking" BOOLEAN NOT NULL DEFAULT false,
    "hasGarden" BOOLEAN NOT NULL DEFAULT false,
    "hasLift" BOOLEAN NOT NULL DEFAULT false,
    "hasWheelchairAccess" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "specialNotes" TEXT,
    "gasSupplier" TEXT,
    "electricitySupplier" TEXT,
    "waterSupplier" TEXT,
    "councilName" TEXT,
    "gasSafetyExpiry" TIMESTAMP(3),
    "epcExpiry" TIMESTAMP(3),
    "eicrExpiry" TIMESTAMP(3),
    "maintenanceRoute" "MaintenanceRoute" NOT NULL DEFAULT 'CONTACT_LANDLORD_FIRST',
    "preferredContractor" TEXT,
    "emergencyRepairPermission" BOOLEAN NOT NULL DEFAULT false,
    "emergencySpendingLimit" DECIMAL(12,2),
    "advertisingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "advertisingTitle" TEXT,
    "photoNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "submittedForReviewAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_landlordProfileId_idx" ON "Property"("landlordProfileId");

-- CreateIndex
CREATE INDEX "Property_postcode_idx" ON "Property"("postcode");

-- CreateIndex
CREATE INDEX "Property_propertyStatus_idx" ON "Property"("propertyStatus");

-- CreateIndex
CREATE INDEX "Property_approvalStatus_idx" ON "Property"("approvalStatus");

-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_landlordProfileId_fkey" FOREIGN KEY ("landlordProfileId") REFERENCES "LandlordProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
