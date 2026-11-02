-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PRO', 'ADMIN');
CREATE TYPE "Trade" AS ENUM ('HVAC', 'PLUMBING', 'ROOFING', 'ELECTRICAL', 'CLEANING', 'LANDSCAPING', 'PEST');
CREATE TYPE "Urgency" AS ENUM ('NOW', 'WEEK', 'FLEX');
CREATE TYPE "LeadStatus" AS ENUM ('OPEN', 'SOLD_OUT', 'CLOSED', 'REJECTED');
CREATE TYPE "PurchaseStatus" AS ENUM ('NEW', 'CALLED', 'QUOTED', 'WON', 'LOST');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');
CREATE TYPE "TxType" AS ENUM ('TOPUP', 'PURCHASE', 'REFUND', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PRO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "ownerId" TEXT NOT NULL,
    "trades" "Trade"[],
    "serviceZips" TEXT[],
    "balanceCents" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "trade" "Trade" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" "Urgency" NOT NULL DEFAULT 'FLEX',
    "homeownerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "zip" TEXT NOT NULL,
    "estValueCents" INTEGER NOT NULL,
    "exclusive" BOOLEAN NOT NULL DEFAULT true,
    "priceCents" INTEGER NOT NULL,
    "maxSlots" INTEGER NOT NULL DEFAULT 1,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "status" "LeadStatus" NOT NULL DEFAULT 'OPEN',
    "source" TEXT NOT NULL DEFAULT 'web',
    "utmSource" TEXT,
    "utmCampaign" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "type" "TxType" NOT NULL,
    "reference" TEXT,
    "stripeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingRule" (
    "trade" "Trade" NOT NULL,
    "exclusiveCents" INTEGER NOT NULL,
    "sharedCents" INTEGER NOT NULL,
    "sharedSlots" INTEGER NOT NULL DEFAULT 3,
    "emergencyMult" DOUBLE PRECISION NOT NULL DEFAULT 1.6,
    "bigJobMult" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "bigJobThresholdCents" INTEGER NOT NULL DEFAULT 500000,
    "avgTicketCents" INTEGER NOT NULL,
    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("trade")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Company_ownerId_key" ON "Company"("ownerId");
CREATE UNIQUE INDEX "Company_stripeCustomerId_key" ON "Company"("stripeCustomerId");
CREATE INDEX "Lead_status_trade_createdAt_idx" ON "Lead"("status", "trade", "createdAt");
CREATE INDEX "Lead_zip_idx" ON "Lead"("zip");
CREATE UNIQUE INDEX "Purchase_leadId_companyId_key" ON "Purchase"("leadId", "companyId");
CREATE INDEX "Purchase_companyId_createdAt_idx" ON "Purchase"("companyId", "createdAt");
CREATE UNIQUE INDEX "RefundRequest_purchaseId_key" ON "RefundRequest"("purchaseId");
CREATE UNIQUE INDEX "Transaction_stripeSessionId_key" ON "Transaction"("stripeSessionId");
CREATE INDEX "Transaction_companyId_createdAt_idx" ON "Transaction"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
