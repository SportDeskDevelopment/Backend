/*
  Warnings:

  - You are about to drop the column `scannedByUserId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `subcriptionId` on the `SubscriptionTrainee` table. All the data in the column will be lost.
  - Added the required column `subscriptionId` to the `SubscriptionTrainee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_scannedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionTrainee" DROP CONSTRAINT "SubscriptionTrainee_subcriptionId_fkey";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "scannedByUserId",
ADD COLUMN     "isPaidByTrainer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "markedByUserId" TEXT,
ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "SubscriptionTrainee" DROP COLUMN "subcriptionId",
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "subscriptionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedByUserId_fkey" FOREIGN KEY ("markedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTrainee" ADD CONSTRAINT "SubscriptionTrainee_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTrainee" ADD CONSTRAINT "SubscriptionTrainee_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
