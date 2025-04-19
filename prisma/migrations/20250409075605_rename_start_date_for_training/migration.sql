/*
  Warnings:

  - You are about to drop the column `date` on the `Training` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Training" DROP COLUMN "date",
ADD COLUMN     "start_date" TIMESTAMP(3);
