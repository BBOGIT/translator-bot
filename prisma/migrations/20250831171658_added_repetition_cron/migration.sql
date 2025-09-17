/*
  Warnings:

  - You are about to drop the column `repetitionTime` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "repetitionTime",
ADD COLUMN     "repetitionCron" TEXT;
