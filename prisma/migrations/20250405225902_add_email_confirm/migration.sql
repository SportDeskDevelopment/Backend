/*
  Warnings:

  - The primary key for the `_GroupTrainers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_GymAdmins` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_TraineeGroups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_TrainerGyms` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_GroupTrainers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_GymAdmins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_TraineeGroups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_TrainerGyms` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailConfirmCode" TEXT,
ADD COLUMN     "isEmailConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "_GroupTrainers" DROP CONSTRAINT "_GroupTrainers_AB_pkey";

-- AlterTable
ALTER TABLE "_GymAdmins" DROP CONSTRAINT "_GymAdmins_AB_pkey";

-- AlterTable
ALTER TABLE "_TraineeGroups" DROP CONSTRAINT "_TraineeGroups_AB_pkey";

-- AlterTable
ALTER TABLE "_TrainerGyms" DROP CONSTRAINT "_TrainerGyms_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_GroupTrainers_AB_unique" ON "_GroupTrainers"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_GymAdmins_AB_unique" ON "_GymAdmins"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_TraineeGroups_AB_unique" ON "_TraineeGroups"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_TrainerGyms_AB_unique" ON "_TrainerGyms"("A", "B");
