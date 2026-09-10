ALTER TABLE "MaintenanceProviderProfile"
ADD COLUMN "providerType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN "companyNumber" TEXT,
ADD COLUMN "serviceArea" TEXT,
ADD COLUMN "businessAddress" TEXT,
ADD COLUMN "idDocumentUrl" TEXT,
ADD COLUMN "idDocumentName" TEXT,
ADD COLUMN "certificateUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "certificateNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
