/*
  Warnings:

  - You are about to drop the `PublicContact` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PublicSocialNetwork" DROP CONSTRAINT "PublicSocialNetwork_publicContactId_fkey";

-- DropForeignKey
ALTER TABLE "TrainerProfile" DROP CONSTRAINT "TrainerProfile_publicContactId_fkey";

-- DropTable
DROP TABLE "PublicContact";

-- CreateTable
CREATE TABLE "PublicInfo" (
    "id" TEXT NOT NULL,
    "phoneNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aboutMe" TEXT,

    CONSTRAINT "PublicInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_publicContactId_fkey" FOREIGN KEY ("publicContactId") REFERENCES "PublicInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicSocialNetwork" ADD CONSTRAINT "PublicSocialNetwork_publicContactId_fkey" FOREIGN KEY ("publicContactId") REFERENCES "PublicInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
