-- AlterTable
ALTER TABLE "IndexingResult" ADD COLUMN "indexStatus" TEXT;
ALTER TABLE "IndexingResult" ADD COLUMN "indexStatusCheckedAt" TIMESTAMP(3);
