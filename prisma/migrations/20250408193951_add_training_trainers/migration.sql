-- CreateTable
CREATE TABLE "_TrainingTrainers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TrainingTrainers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TrainingTrainers_B_index" ON "_TrainingTrainers"("B");

-- AddForeignKey
ALTER TABLE "_TrainingTrainers" ADD CONSTRAINT "_TrainingTrainers_A_fkey" FOREIGN KEY ("A") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrainingTrainers" ADD CONSTRAINT "_TrainingTrainers_B_fkey" FOREIGN KEY ("B") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;
