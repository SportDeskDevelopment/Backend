-- DropForeignKey
ALTER TABLE "Training" DROP CONSTRAINT "Training_gymId_fkey";

-- AlterTable
ALTER TABLE "Training" ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "date" DROP NOT NULL,
ALTER COLUMN "gymId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;
