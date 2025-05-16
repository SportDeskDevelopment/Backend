-- CreateEnum
CREATE TYPE "SubscriptionTrainingType" AS ENUM ('GROUP', 'INDIVIDUAL', 'GROUP_AND_INDIVIDUAL');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "trainingType" "SubscriptionTrainingType" NOT NULL DEFAULT 'GROUP_AND_INDIVIDUAL';
