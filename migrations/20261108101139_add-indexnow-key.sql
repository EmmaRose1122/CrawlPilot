-- IndexNow requires a per-user key that the user hosts at
-- https://<their-domain>/<key>.txt so the search engines can verify ownership.
ALTER TABLE "User" ADD COLUMN "indexNowKey" TEXT;

CREATE UNIQUE INDEX "User_indexNowKey_key" ON "User"("indexNowKey");
