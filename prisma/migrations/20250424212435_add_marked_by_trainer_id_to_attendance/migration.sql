/*
  Warnings:

  - You are about to drop the column `isPaidByTrainer` on the `Attendance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "isPaidByTrainer",
ADD COLUMN     "markedAsPaidByTrainerId" TEXT;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedAsPaidByTrainerId_fkey" FOREIGN KEY ("markedAsPaidByTrainerId") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
