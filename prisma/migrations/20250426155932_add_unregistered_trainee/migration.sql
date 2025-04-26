-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_traineeId_fkey";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "unregisteredTraineeId" TEXT,
ALTER COLUMN "traineeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TraineeProfile" ADD COLUMN     "unregisteredTraineeId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "age" INTEGER;

-- CreateTable
CREATE TABLE "UnregisteredTrainee" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "age" INTEGER,
    "firstName" TEXT,
    "lastName" TEXT,
    "notes" TEXT,
    "displayName" TEXT,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "traineeId" TEXT,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UnregisteredTrainee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "TraineeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_unregisteredTraineeId_fkey" FOREIGN KEY ("unregisteredTraineeId") REFERENCES "UnregisteredTrainee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnregisteredTrainee" ADD CONSTRAINT "UnregisteredTrainee_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "TraineeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnregisteredTrainee" ADD CONSTRAINT "UnregisteredTrainee_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
