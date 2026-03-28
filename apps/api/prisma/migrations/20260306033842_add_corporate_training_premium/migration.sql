-- CreateTable
CREATE TABLE "corporate_subscriptions" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "plan" TEXT NOT NULL,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "monthlyBudget" DECIMAL(12,2) NOT NULL,
    "usedBudget" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_members" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corporate_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_modules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "durationMins" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "completedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_listings" (
    "id" TEXT NOT NULL,
    "escortId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premium_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "corporate_subscriptions_status_idx" ON "corporate_subscriptions"("status");

-- CreateIndex
CREATE INDEX "corporate_subscriptions_companyName_idx" ON "corporate_subscriptions"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_members_subscriptionId_userId_key" ON "corporate_members"("subscriptionId", "userId");

-- CreateIndex
CREATE INDEX "training_modules_category_idx" ON "training_modules"("category");

-- CreateIndex
CREATE INDEX "training_modules_isPublished_idx" ON "training_modules"("isPublished");

-- CreateIndex
CREATE INDEX "training_progress_userId_idx" ON "training_progress"("userId");

-- CreateIndex
CREATE INDEX "training_progress_status_idx" ON "training_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_userId_moduleId_key" ON "training_progress"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "premium_listings_escortId_idx" ON "premium_listings"("escortId");

-- CreateIndex
CREATE INDEX "premium_listings_type_isActive_idx" ON "premium_listings"("type", "isActive");

-- CreateIndex
CREATE INDEX "premium_listings_endDate_idx" ON "premium_listings"("endDate");

-- AddForeignKey
ALTER TABLE "corporate_members" ADD CONSTRAINT "corporate_members_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "corporate_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
