-- CreateEnum
CREATE TYPE "Sports" AS ENUM ('KARATE', 'BOX', 'SWIMMING');

-- AlterTable
ALTER TABLE "TrainerProfile" ADD COLUMN     "description" TEXT,
ADD COLUMN     "publicContactId" TEXT,
ADD COLUMN     "sports" "Sports"[] DEFAULT ARRAY[]::"Sports"[],
ADD COLUMN     "trainingSince" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "PublicContact" (
    "id" TEXT NOT NULL,
    "phoneNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emails" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "PublicContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialNetwork" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "SocialNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SocialPublicContacts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SocialPublicContacts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SocialPublicContacts_B_index" ON "_SocialPublicContacts"("B");

-- AddForeignKey
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_publicContactId_fkey" FOREIGN KEY ("publicContactId") REFERENCES "PublicContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SocialPublicContacts" ADD CONSTRAINT "_SocialPublicContacts_A_fkey" FOREIGN KEY ("A") REFERENCES "PublicContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SocialPublicContacts" ADD CONSTRAINT "_SocialPublicContacts_B_fkey" FOREIGN KEY ("B") REFERENCES "SocialNetwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
