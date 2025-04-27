-- AlterTable
ALTER TABLE "TrainerLimits" ADD COLUMN     "maxSubscriptions" INTEGER;

-- CreateTable
CREATE TABLE "DefaultTrainerLimits" (
    "id" TEXT NOT NULL,
    "maxTrainees" INTEGER,
    "maxGroups" INTEGER,
    "maxGyms" INTEGER,
    "maxTemplates" INTEGER,
    "maxSubscriptions" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "PlanType" NOT NULL,

    CONSTRAINT "DefaultTrainerLimits_pkey" PRIMARY KEY ("id")
);
