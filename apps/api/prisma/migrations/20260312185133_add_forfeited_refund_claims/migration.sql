-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NONE', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('KTP', 'PASSPORT', 'SIM', 'KITAS');

-- CreateEnum
CREATE TYPE "RefundClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "replacementNote" TEXT,
ADD COLUMN     "replacementRequested" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "escort_profiles" ADD COLUMN     "age" TEXT,
ADD COLUMN     "basedIn" TEXT,
ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "complexion" TEXT,
ADD COLUMN     "eyeColor" TEXT,
ADD COLUMN     "favourites" JSONB,
ADD COLUMN     "fieldOfWork" TEXT,
ADD COLUMN     "hairStyle" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "smoking" TEXT,
ADD COLUMN     "tattooPiercing" TEXT,
ADD COLUMN     "travelScope" TEXT,
ADD COLUMN     "weight" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "forfeited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentType" TEXT NOT NULL DEFAULT 'FULL';

-- CreateTable
CREATE TABLE "refund_claims" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "RefundClaimStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),
    "handledBy" TEXT,

    CONSTRAINT "refund_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "documentType" "KycDocumentType" NOT NULL DEFAULT 'KTP',
    "documentNumber" TEXT,
    "documentFrontUrl" TEXT,
    "documentBackUrl" TEXT,
    "selfieUrl" TEXT,
    "livenessScore" DOUBLE PRECISION,
    "faceMatchScore" DOUBLE PRECISION,
    "ocrData" JSONB,
    "providerRef" TEXT,
    "providerResponse" JSONB,
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refund_claims_bookingId_idx" ON "refund_claims"("bookingId");

-- CreateIndex
CREATE INDEX "refund_claims_paymentId_idx" ON "refund_claims"("paymentId");

-- CreateIndex
CREATE INDEX "refund_claims_status_idx" ON "refund_claims"("status");

-- CreateIndex
CREATE INDEX "kyc_verifications_userId_idx" ON "kyc_verifications"("userId");

-- CreateIndex
CREATE INDEX "kyc_verifications_status_idx" ON "kyc_verifications"("status");

-- CreateIndex
CREATE INDEX "kyc_verifications_createdAt_idx" ON "kyc_verifications"("createdAt");

-- AddForeignKey
ALTER TABLE "refund_claims" ADD CONSTRAINT "refund_claims_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_claims" ADD CONSTRAINT "refund_claims_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_claims" ADD CONSTRAINT "refund_claims_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
