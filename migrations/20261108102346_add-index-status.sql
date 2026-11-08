-- URL Inspection API results are cached on each indexing record.
ALTER TABLE "IndexingResult" ADD COLUMN "indexStatus" TEXT;
ALTER TABLE "IndexingResult" ADD COLUMN "indexStatusCheckedAt" TIMESTAMP(3);
