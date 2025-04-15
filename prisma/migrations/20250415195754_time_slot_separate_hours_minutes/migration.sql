/*
  Warnings:

  - You are about to drop the column `time` on the `TimeSlot` table. All the data in the column will be lost.
  - Added the required column `hours` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minutes` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TrainingTemplate" DROP CONSTRAINT "TrainingTemplate_groupId_fkey";

-- AlterTable
ALTER TABLE "TimeSlot" DROP COLUMN "time",
ADD COLUMN     "hours" INTEGER NOT NULL,
ADD COLUMN     "minutes" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TrainingTemplate" ALTER COLUMN "groupId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TrainingTemplate" ADD CONSTRAINT "TrainingTemplate_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
