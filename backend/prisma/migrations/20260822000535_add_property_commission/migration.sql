-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('FIXED', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "commissionAmount" DECIMAL(12,2),
ADD COLUMN     "commissionType" "CommissionType",
ADD COLUMN     "commissionValue" DECIMAL(12,2),
ADD COLUMN     "tenantMonthlyRent" DECIMAL(12,2);
