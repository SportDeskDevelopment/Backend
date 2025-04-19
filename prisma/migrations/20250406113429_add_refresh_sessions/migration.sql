/*
  Warnings:

  - You are about to drop the column `token` on the `RefreshSession` table. All the data in the column will be lost.
  - Added the required column `tokenHash` to the `RefreshSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RefreshSession` table without a default value. This is not possible if the table is not empty.
  - Made the column `ip` on table `RefreshSession` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userAgent` on table `RefreshSession` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "RefreshSession_token_key";

-- AlterTable
ALTER TABLE "RefreshSession" DROP COLUMN "token",
ADD COLUMN     "tokenHash" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "ip" SET NOT NULL,
ALTER COLUMN "userAgent" SET NOT NULL;

-- CreateIndex
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");

-- CreateIndex
CREATE INDEX "RefreshSession_tokenHash_idx" ON "RefreshSession"("tokenHash");
