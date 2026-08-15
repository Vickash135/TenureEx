-- AlterTable
ALTER TABLE "AgencyApplication" ADD COLUMN     "additionalInfoRequestedAt" TIMESTAMP(3),
ADD COLUMN     "additionalInfoResolvedAt" TIMESTAMP(3),
ADD COLUMN     "additionalInfoRespondedAt" TIMESTAMP(3),
ADD COLUMN     "additionalInfoResponse" TEXT;

-- CreateIndex
CREATE INDEX "AgencyApplication_additionalInfoRespondedAt_idx" ON "AgencyApplication"("additionalInfoRespondedAt");
