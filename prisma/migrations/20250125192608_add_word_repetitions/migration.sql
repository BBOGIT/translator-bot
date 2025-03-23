/*
  Warnings:

  - Made the column `needToLearn` on table `words` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "words" ADD COLUMN     "lastNotificationAt" TIMESTAMP(3),
ADD COLUMN     "lastRepeatAt" TIMESTAMP(3),
ADD COLUMN     "nextRepeatDate" TIMESTAMP(3),
ADD COLUMN     "repeatCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "needToLearn" SET NOT NULL,
ALTER COLUMN "needToLearn" SET DEFAULT true;

-- CreateTable
CREATE TABLE "word_repetitions" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wordId" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "intervalNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "word_repetitions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "word_repetitions" ADD CONSTRAINT "word_repetitions_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
