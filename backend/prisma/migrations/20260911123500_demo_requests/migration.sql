CREATE TABLE "DemoRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DemoRequest_email_key" ON "DemoRequest"("email");
CREATE INDEX "DemoRequest_status_idx" ON "DemoRequest"("status");
CREATE INDEX "DemoRequest_requestedAt_idx" ON "DemoRequest"("requestedAt");
