-- CreateEnum
CREATE TYPE "OnboardingNextStep" AS ENUM ('GYMS', 'GROUPS', 'SUBSCRIPTIONS', 'TRAININGS', 'CONTACT_INFORMATION', 'COMPLETED');

-- AlterTable
ALTER TABLE "TrainerProfile" ADD COLUMN     "onboardingNextStep" "OnboardingNextStep" NOT NULL DEFAULT 'GYMS';
