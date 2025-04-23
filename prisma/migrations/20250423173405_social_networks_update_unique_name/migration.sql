/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `SocialNetwork` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SocialNetwork_name_key" ON "SocialNetwork"("name");
