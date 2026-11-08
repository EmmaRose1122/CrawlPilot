-- Sync migration: adds columns and tables present in schema.prisma but
-- missing from the earlier migration files.

-- User additions
ALTER TABLE "User" ADD COLUMN "googleIndexingConfig" TEXT;
ALTER TABLE "User" ADD COLUMN "apiToken" TEXT;
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredBy" TEXT;

CREATE UNIQUE INDEX "User_apiToken_key" ON "User"("apiToken");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- IndexingResult additions
ALTER TABLE "IndexingResult" ADD COLUMN "signalingResults" TEXT;
ALTER TABLE "IndexingResult" ADD COLUMN "links" TEXT;
ALTER TABLE "IndexingResult" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Task tables (never created by earlier migrations)
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reward" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'general',
    "link" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskSubmission" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proofText" TEXT,
    "proofImage" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskSubmission_taskId_idx" ON "TaskSubmission"("taskId");
CREATE INDEX "TaskSubmission_userId_idx" ON "TaskSubmission"("userId");

ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
