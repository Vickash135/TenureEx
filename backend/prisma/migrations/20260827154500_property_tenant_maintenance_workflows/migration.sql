-- TenureEx property-specific tenant + maintenance workflow
-- Additive migration only: no existing tables/columns are removed.

CREATE TABLE "TenantPropertyInquiry" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "userId" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantPropertyInquiry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantInvitation" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantInvitation_tokenHash_key" ON "TenantInvitation"("tokenHash");

CREATE TABLE "TenantPropertyApplication" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "tenantUserId" TEXT NOT NULL,
  "tenantProfileId" TEXT NOT NULL,
  "invitationId" TEXT,
  "agencyId" TEXT NOT NULL,
  "landlordUserId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_DETAILS',
  "dateOfBirth" TIMESTAMP(3),
  "currentAddress" TEXT,
  "postcode" TEXT,
  "phone" TEXT,
  "identificationType" TEXT,
  "identificationFileUrl" TEXT,
  "emergencyContactName" TEXT,
  "emergencyContactPhone" TEXT,
  "additionalNotes" TEXT,
  "agreementTitle" TEXT,
  "agreementVersion" TEXT,
  "agreementTerms" JSONB,
  "agreementSignedAt" TIMESTAMP(3),
  "signatureName" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "rejectionReason" TEXT,
  "moreInformationRequest" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantPropertyApplication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantPropertyApplication_invitationId_key" ON "TenantPropertyApplication"("invitationId");
CREATE UNIQUE INDEX "TenantPropertyApplication_propertyId_tenantProfileId_key" ON "TenantPropertyApplication"("propertyId", "tenantProfileId");

CREATE TABLE "PropertyTenant" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "tenantUserId" TEXT NOT NULL,
  "tenantProfileId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyTenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PropertyTenant_applicationId_key" ON "PropertyTenant"("applicationId");
CREATE UNIQUE INDEX "PropertyTenant_propertyId_tenantProfileId_key" ON "PropertyTenant"("propertyId", "tenantProfileId");

CREATE TABLE "MaintenanceInvitation" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "invitedByRole" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "tradeType" TEXT,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaintenanceInvitation_tokenHash_key" ON "MaintenanceInvitation"("tokenHash");

CREATE TABLE "PropertyMaintenanceProvider" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "maintenanceUserId" TEXT NOT NULL,
  "maintenanceProfileId" TEXT NOT NULL,
  "addedByUserId" TEXT NOT NULL,
  "addedByRole" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
  "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyMaintenanceProvider_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PropertyMaintenanceProvider_propertyId_maintenanceProfileId_key" ON "PropertyMaintenanceProvider"("propertyId", "maintenanceProfileId");

CREATE TABLE "MaintenanceRequest" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "tenantUserId" TEXT NOT NULL,
  "tenantProfileId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "roomLocation" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "accessPermission" BOOLEAN NOT NULL DEFAULT false,
  "assignedProviderUserId" TEXT,
  "assignedProviderProfileId" TEXT,
  "scheduledStart" TIMESTAMP(3),
  "scheduledEnd" TIMESTAMP(3),
  "providerNotes" TEXT,
  "completionNotes" TEXT,
  "tenantCompletionNote" TEXT,
  "completedByProviderAt" TIMESTAMP(3),
  "tenantConfirmedAt" TIMESTAMP(3),
  "reopenedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenanceTimeSlot" (
  "id" TEXT NOT NULL,
  "maintenanceRequestId" TEXT NOT NULL,
  "proposedBy" TEXT NOT NULL,
  "providerUserId" TEXT,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceTimeSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenanceRequestPhoto" (
  "id" TEXT NOT NULL,
  "maintenanceRequestId" TEXT NOT NULL,
  "uploadedByUserId" TEXT NOT NULL,
  "phase" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceRequestPhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "recipientUserId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TenantPropertyInquiry_propertyId_idx" ON "TenantPropertyInquiry"("propertyId");
CREATE INDEX "TenantPropertyInquiry_email_idx" ON "TenantPropertyInquiry"("email");
CREATE INDEX "TenantPropertyInquiry_status_idx" ON "TenantPropertyInquiry"("status");
CREATE INDEX "TenantInvitation_propertyId_idx" ON "TenantInvitation"("propertyId");
CREATE INDEX "TenantInvitation_agencyId_idx" ON "TenantInvitation"("agencyId");
CREATE INDEX "TenantInvitation_email_idx" ON "TenantInvitation"("email");
CREATE INDEX "TenantInvitation_status_idx" ON "TenantInvitation"("status");
CREATE INDEX "TenantPropertyApplication_propertyId_idx" ON "TenantPropertyApplication"("propertyId");
CREATE INDEX "TenantPropertyApplication_tenantUserId_idx" ON "TenantPropertyApplication"("tenantUserId");
CREATE INDEX "TenantPropertyApplication_agencyId_idx" ON "TenantPropertyApplication"("agencyId");
CREATE INDEX "TenantPropertyApplication_status_idx" ON "TenantPropertyApplication"("status");
CREATE INDEX "PropertyTenant_propertyId_idx" ON "PropertyTenant"("propertyId");
CREATE INDEX "PropertyTenant_tenantUserId_idx" ON "PropertyTenant"("tenantUserId");
CREATE INDEX "PropertyTenant_status_idx" ON "PropertyTenant"("status");
CREATE INDEX "MaintenanceInvitation_propertyId_idx" ON "MaintenanceInvitation"("propertyId");
CREATE INDEX "MaintenanceInvitation_email_idx" ON "MaintenanceInvitation"("email");
CREATE INDEX "MaintenanceInvitation_status_idx" ON "MaintenanceInvitation"("status");
CREATE INDEX "PropertyMaintenanceProvider_propertyId_idx" ON "PropertyMaintenanceProvider"("propertyId");
CREATE INDEX "PropertyMaintenanceProvider_maintenanceUserId_idx" ON "PropertyMaintenanceProvider"("maintenanceUserId");
CREATE INDEX "PropertyMaintenanceProvider_status_idx" ON "PropertyMaintenanceProvider"("status");
CREATE INDEX "MaintenanceRequest_propertyId_idx" ON "MaintenanceRequest"("propertyId");
CREATE INDEX "MaintenanceRequest_tenantUserId_idx" ON "MaintenanceRequest"("tenantUserId");
CREATE INDEX "MaintenanceRequest_assignedProviderUserId_idx" ON "MaintenanceRequest"("assignedProviderUserId");
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");
CREATE INDEX "MaintenanceTimeSlot_maintenanceRequestId_idx" ON "MaintenanceTimeSlot"("maintenanceRequestId");
CREATE INDEX "MaintenanceTimeSlot_providerUserId_idx" ON "MaintenanceTimeSlot"("providerUserId");
CREATE INDEX "MaintenanceTimeSlot_status_idx" ON "MaintenanceTimeSlot"("status");
CREATE INDEX "MaintenanceRequestPhoto_maintenanceRequestId_idx" ON "MaintenanceRequestPhoto"("maintenanceRequestId");
CREATE INDEX "MaintenanceRequestPhoto_phase_idx" ON "MaintenanceRequestPhoto"("phase");
CREATE INDEX "Notification_recipientUserId_idx" ON "Notification"("recipientUserId");
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
