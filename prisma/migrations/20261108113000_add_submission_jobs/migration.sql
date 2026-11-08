-- CreateTable
CREATE TABLE "SubmissionJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionJob_status_availableAt_idx" ON "SubmissionJob"("status", "availableAt");

-- CreateIndex
CREATE INDEX "SubmissionJob_userId_idx" ON "SubmissionJob"("userId");

-- AddForeignKey
ALTER TABLE "SubmissionJob" ADD CONSTRAINT "SubmissionJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
