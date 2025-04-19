-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('TRAINER', 'TRAINEE', 'PARENT', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "LangCode" AS ENUM ('EN', 'UA', 'PL');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'TRIAL', 'PREMIUM', 'LIMITED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'USED_UP');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('GROUP', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "preferredLang" "LangCode" NOT NULL DEFAULT 'EN',
    "activeRole" "RoleType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "type" "RoleType" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentPlan" "PlanType" NOT NULL DEFAULT 'FREE',
    "planStartedAt" TIMESTAMP(3),
    "planUntil" TIMESTAMP(3),
    "trialActivatedAt" TIMESTAMP(3),

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerLimits" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "maxTrainees" INTEGER,
    "maxGroups" INTEGER,
    "maxGyms" INTEGER,
    "maxTemplates" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerLimits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralInvite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "acceptedById" TEXT,
    "usedAt" TIMESTAMP(3),
    "bonusGranted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReferralInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraineeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TraineeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerTraineeLink" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "frozenAt" TIMESTAMP(3),

    CONSTRAINT "TrainerTraineeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentTraineeLink" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,

    CONSTRAINT "ParentTraineeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gym" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "workHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gymId" TEXT,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "type" "TrainingType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "gymId" TEXT NOT NULL,
    "groupId" TEXT,
    "templateId" TEXT,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedByUserId" TEXT,
    "subscriptionId" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "maxTrainings" INTEGER,
    "validUntil" TIMESTAMP(3),
    "usedTrainings" INTEGER NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingTemplate" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "gymId" TEXT,
    "durationMin" INTEGER NOT NULL,
    "type" "TrainingType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "dayOfWeek" "WeekDay" NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GymAdmins" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GymAdmins_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TrainerGyms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TrainerGyms_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TraineeGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TraineeGroups_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GroupTrainers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupTrainers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_type_userId_key" ON "Role"("type", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "TrainerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerLimits_trainerId_key" ON "TrainerLimits"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralInvite_code_key" ON "ReferralInvite"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralInvite_acceptedById_key" ON "ReferralInvite"("acceptedById");

-- CreateIndex
CREATE UNIQUE INDEX "TraineeProfile_userId_key" ON "TraineeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerTraineeLink_trainerId_traineeId_key" ON "TrainerTraineeLink"("trainerId", "traineeId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentTraineeLink_parentId_traineeId_key" ON "ParentTraineeLink"("parentId", "traineeId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramLink_userId_key" ON "TelegramLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramLink_telegramId_key" ON "TelegramLink"("telegramId");

-- CreateIndex
CREATE INDEX "_GymAdmins_B_index" ON "_GymAdmins"("B");

-- CreateIndex
CREATE INDEX "_TrainerGyms_B_index" ON "_TrainerGyms"("B");

-- CreateIndex
CREATE INDEX "_TraineeGroups_B_index" ON "_TraineeGroups"("B");

-- CreateIndex
CREATE INDEX "_GroupTrainers_B_index" ON "_GroupTrainers"("B");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerLimits" ADD CONSTRAINT "TrainerLimits_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralInvite" ADD CONSTRAINT "ReferralInvite_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralInvite" ADD CONSTRAINT "ReferralInvite_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraineeProfile" ADD CONSTRAINT "TraineeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerTraineeLink" ADD CONSTRAINT "TrainerTraineeLink_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerTraineeLink" ADD CONSTRAINT "TrainerTraineeLink_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "TraineeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentTraineeLink" ADD CONSTRAINT "ParentTraineeLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentTraineeLink" ADD CONSTRAINT "ParentTraineeLink_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "TraineeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramLink" ADD CONSTRAINT "TelegramLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TrainingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "TraineeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_scannedByUserId_fkey" FOREIGN KEY ("scannedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "TraineeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingTemplate" ADD CONSTRAINT "TrainingTemplate_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingTemplate" ADD CONSTRAINT "TrainingTemplate_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingTemplate" ADD CONSTRAINT "TrainingTemplate_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TrainingTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GymAdmins" ADD CONSTRAINT "_GymAdmins_A_fkey" FOREIGN KEY ("A") REFERENCES "AdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GymAdmins" ADD CONSTRAINT "_GymAdmins_B_fkey" FOREIGN KEY ("B") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrainerGyms" ADD CONSTRAINT "_TrainerGyms_A_fkey" FOREIGN KEY ("A") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrainerGyms" ADD CONSTRAINT "_TrainerGyms_B_fkey" FOREIGN KEY ("B") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TraineeGroups" ADD CONSTRAINT "_TraineeGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TraineeGroups" ADD CONSTRAINT "_TraineeGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "TraineeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupTrainers" ADD CONSTRAINT "_GroupTrainers_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupTrainers" ADD CONSTRAINT "_GroupTrainers_B_fkey" FOREIGN KEY ("B") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
