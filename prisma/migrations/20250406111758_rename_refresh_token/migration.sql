/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `RefreshSession` table. All the data in the column will be lost.
  - Added the required column `token` to the `RefreshSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RefreshSession" DROP COLUMN "tokenHash",
ADD COLUMN     "token" TEXT NOT NULL,
ALTER COLUMN "deviceId" DROP NOT NULL;
