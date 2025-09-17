/*
  Warnings:

  - You are about to drop the column `repetitionCron` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "repetitionCron",
ADD COLUMN     "repetitionTime" TEXT;
