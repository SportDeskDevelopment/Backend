-- AlterTable
ALTER TABLE "TrainerProfile" ADD COLUMN     "qrCodeKey" TEXT;

-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TrainingTemplate" ADD COLUMN     "trainingPrice" DOUBLE PRECISION;
