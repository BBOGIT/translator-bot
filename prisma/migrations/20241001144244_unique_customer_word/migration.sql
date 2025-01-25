/*
  Warnings:

  - A unique constraint covering the columns `[customerId,word]` on the table `words` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "words_word_key";

-- CreateIndex
CREATE UNIQUE INDEX "words_customerId_word_key" ON "words"("customerId", "word");
