/*
  Warnings:

  - You are about to drop the column `isPaid` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `usedTrainings` on the `Subscription` table. All the data in the column will be lost.
  - Added the required column `description` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Subscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('PERIOD', 'DAYS', 'PERIOD_AND_DAYS');

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "isPaid",
DROP COLUMN "usedTrainings",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "type",
ADD COLUMN     "type" "SubscriptionType" NOT NULL;

-- CreateTable
CREATE TABLE "SubscriptionTrainee" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "subcriptionId" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "trainingsLeft" INTEGER,

    CONSTRAINT "SubscriptionTrainee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GroupToSubscription" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupToSubscription_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GroupToSubscription_B_index" ON "_GroupToSubscription"("B");

-- AddForeignKey
ALTER TABLE "SubscriptionTrainee" ADD CONSTRAINT "SubscriptionTrainee_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "TraineeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTrainee" ADD CONSTRAINT "SubscriptionTrainee_subcriptionId_fkey" FOREIGN KEY ("subcriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToSubscription" ADD CONSTRAINT "_GroupToSubscription_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToSubscription" ADD CONSTRAINT "_GroupToSubscription_B_fkey" FOREIGN KEY ("B") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
