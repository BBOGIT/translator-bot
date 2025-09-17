-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hashedRt" TEXT;

-- CreateIndex
CREATE INDEX "customers_state_idx" ON "customers"("state");

-- CreateIndex
CREATE INDEX "word_repetitions_wordId_idx" ON "word_repetitions"("wordId");

-- CreateIndex
CREATE INDEX "word_repetitions_createdAt_idx" ON "word_repetitions"("createdAt");

-- CreateIndex
CREATE INDEX "words_customerId_needToLearn_idx" ON "words"("customerId", "needToLearn");

-- CreateIndex
CREATE INDEX "words_needToLearn_lastNotificationAt_idx" ON "words"("needToLearn", "lastNotificationAt");

-- CreateIndex
CREATE INDEX "words_updatedAt_idx" ON "words"("updatedAt");
