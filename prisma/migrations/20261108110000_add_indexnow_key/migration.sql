-- AlterTable
ALTER TABLE "User" ADD COLUMN "indexNowKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_indexNowKey_key" ON "User"("indexNowKey");
