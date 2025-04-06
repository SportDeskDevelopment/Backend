/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `RefreshSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_token_key" ON "RefreshSession"("token");
