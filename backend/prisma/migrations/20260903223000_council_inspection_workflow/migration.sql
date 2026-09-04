CREATE TABLE "CouncilInvitation" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "councilName" TEXT NOT NULL,
  "department" TEXT,
  "jobTitle" TEXT,
  "employeeId" TEXT,
  "tokenHash" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CouncilInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CouncilInvitation_tokenHash_key" ON "CouncilInvitation"("tokenHash");
CREATE INDEX "CouncilInvitation_email_idx" ON "CouncilInvitation"("email");
CREATE INDEX "CouncilInvitation_status_idx" ON "CouncilInvitation"("status");

CREATE TABLE "CouncilInspectionCase" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "inspectorUserId" TEXT,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "accessNotes" TEXT,
  "scheduledStart" TIMESTAMP(3),
  "scheduledEnd" TIMESTAMP(3),
  "inspectionNotes" TEXT,
  "outcome" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CouncilInspectionCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CouncilInspectionCase_propertyId_idx" ON "CouncilInspectionCase"("propertyId");
CREATE INDEX "CouncilInspectionCase_requestedByUserId_idx" ON "CouncilInspectionCase"("requestedByUserId");
CREATE INDEX "CouncilInspectionCase_inspectorUserId_idx" ON "CouncilInspectionCase"("inspectorUserId");
CREATE INDEX "CouncilInspectionCase_status_idx" ON "CouncilInspectionCase"("status");
CREATE INDEX "CouncilInspectionCase_createdAt_idx" ON "CouncilInspectionCase"("createdAt");

CREATE TABLE "CouncilInspectionFinding" (
  "id" TEXT NOT NULL,
  "inspectionId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "hazard" TEXT,
  "severity" TEXT NOT NULL,
  "location" TEXT,
  "description" TEXT NOT NULL,
  "recommendation" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CouncilInspectionFinding_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CouncilInspectionFinding_inspectionId_idx" ON "CouncilInspectionFinding"("inspectionId");

CREATE TABLE "CouncilInspectionAction" (
  "id" TEXT NOT NULL,
  "inspectionId" TEXT NOT NULL,
  "findingId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "dueAt" TIMESTAMP(3),
  "maintenanceRequestId" TEXT,
  "completedAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CouncilInspectionAction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CouncilInspectionAction_inspectionId_idx" ON "CouncilInspectionAction"("inspectionId");
CREATE INDEX "CouncilInspectionAction_maintenanceRequestId_idx" ON "CouncilInspectionAction"("maintenanceRequestId");
CREATE INDEX "CouncilInspectionAction_status_idx" ON "CouncilInspectionAction"("status");

CREATE TABLE "CouncilInspectionEvidence" (
  "id" TEXT NOT NULL,
  "inspectionId" TEXT NOT NULL,
  "actionId" TEXT,
  "uploadedByUserId" TEXT NOT NULL,
  "note" TEXT,
  "fileName" TEXT,
  "fileUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouncilInspectionEvidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CouncilInspectionEvidence_inspectionId_idx" ON "CouncilInspectionEvidence"("inspectionId");
CREATE INDEX "CouncilInspectionEvidence_actionId_idx" ON "CouncilInspectionEvidence"("actionId");

CREATE TABLE "CouncilInspectionEvent" (
  "id" TEXT NOT NULL,
  "inspectionId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouncilInspectionEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CouncilInspectionEvent_inspectionId_idx" ON "CouncilInspectionEvent"("inspectionId");
CREATE INDEX "CouncilInspectionEvent_createdAt_idx" ON "CouncilInspectionEvent"("createdAt");
