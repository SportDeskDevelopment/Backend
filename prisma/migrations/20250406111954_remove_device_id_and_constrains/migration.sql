/*
  Warnings:

  - You are about to drop the column `deviceId` on the `RefreshSession` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "RefreshSession_userId_deviceId_key";

-- AlterTable
ALTER TABLE "RefreshSession" DROP COLUMN "deviceId";

-- AlterTable
ALTER TABLE "_GroupTrainers" ADD CONSTRAINT "_GroupTrainers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GroupTrainers_AB_unique";

-- AlterTable
ALTER TABLE "_GymAdmins" ADD CONSTRAINT "_GymAdmins_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GymAdmins_AB_unique";

-- AlterTable
ALTER TABLE "_TraineeGroups" ADD CONSTRAINT "_TraineeGroups_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_TraineeGroups_AB_unique";

-- AlterTable
ALTER TABLE "_TrainerGyms" ADD CONSTRAINT "_TrainerGyms_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_TrainerGyms_AB_unique";
