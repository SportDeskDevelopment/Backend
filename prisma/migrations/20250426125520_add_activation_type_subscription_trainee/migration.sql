/*
  Warnings:

  - You are about to drop the column `activatedAt` on the `SubscriptionTrainee` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubscriptionActivationType" AS ENUM ('WHEN_TRAINING_ATTENDED', 'FROM_PARTICULAR_DATE', 'FROM_ACTIVE_SUBSCRIPTION_ENDS');

-- AlterTable
ALTER TABLE "SubscriptionTrainee" DROP COLUMN "activatedAt",
ADD COLUMN     "activationType" "SubscriptionActivationType",
ADD COLUMN     "activeFromDate" TIMESTAMP(3);
