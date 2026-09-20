CREATE TABLE "DemoBooking" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "demoDate" TEXT NOT NULL,
    "demoTime" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemoBooking_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DemoBooking_email_idx" ON "DemoBooking"("email");
CREATE INDEX "DemoBooking_scheduledFor_idx" ON "DemoBooking"("scheduledFor");
CREATE INDEX "DemoBooking_status_idx" ON "DemoBooking"("status");
