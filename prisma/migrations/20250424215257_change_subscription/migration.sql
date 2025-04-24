/*
  Warnings:

  - You are about to drop the column `description` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `traineeId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `Subscription` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `SubscriptionTrainee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_traineeId_fkey";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "description",
DROP COLUMN "status",
DROP COLUMN "traineeId",
DROP COLUMN "validUntil",
ADD COLUMN     "maxDays" INTEGER,
ADD COLUMN     "price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SubscriptionTrainee" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validUntil" TIMESTAMP(3);

-- DropEnum
DROP TYPE "SubscriptionStatus";
