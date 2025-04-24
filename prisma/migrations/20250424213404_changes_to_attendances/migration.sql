/*
  Warnings:

  - You are about to drop the column `markedByUserId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `Attendance` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_markedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_subscriptionId_fkey";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "markedByUserId",
DROP COLUMN "subscriptionId",
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "subscriptionTraineeId" TEXT;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subscriptionTraineeId_fkey" FOREIGN KEY ("subscriptionTraineeId") REFERENCES "SubscriptionTrainee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
