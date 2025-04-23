/*
  Warnings:

  - You are about to drop the column `url` on the `SocialNetwork` table. All the data in the column will be lost.
  - You are about to drop the `_SocialPublicContacts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_SocialPublicContacts" DROP CONSTRAINT "_SocialPublicContacts_A_fkey";

-- DropForeignKey
ALTER TABLE "_SocialPublicContacts" DROP CONSTRAINT "_SocialPublicContacts_B_fkey";

-- AlterTable
ALTER TABLE "SocialNetwork" DROP COLUMN "url";

-- DropTable
DROP TABLE "_SocialPublicContacts";

-- CreateTable
CREATE TABLE "PublicSocialNetwork" (
    "id" TEXT NOT NULL,
    "publicContactId" TEXT NOT NULL,
    "socialNetworkId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "PublicSocialNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicSocialNetwork_publicContactId_socialNetworkId_key" ON "PublicSocialNetwork"("publicContactId", "socialNetworkId");

-- AddForeignKey
ALTER TABLE "PublicSocialNetwork" ADD CONSTRAINT "PublicSocialNetwork_publicContactId_fkey" FOREIGN KEY ("publicContactId") REFERENCES "PublicContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicSocialNetwork" ADD CONSTRAINT "PublicSocialNetwork_socialNetworkId_fkey" FOREIGN KEY ("socialNetworkId") REFERENCES "SocialNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
