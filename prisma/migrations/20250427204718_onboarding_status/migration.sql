/*
  Warnings:

  - You are about to drop the column `onboardingNextStep` on the `TrainerProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TrainerProfile" DROP COLUMN "onboardingNextStep",
ADD COLUMN     "isOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "OnboardingNextStep";
