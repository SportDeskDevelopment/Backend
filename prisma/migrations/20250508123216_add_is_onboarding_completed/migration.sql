-- AlterTable
ALTER TABLE "ParentProfile" ADD COLUMN     "isOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TraineeProfile" ADD COLUMN     "isOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
