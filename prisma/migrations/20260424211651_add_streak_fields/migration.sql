-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "lastActiveDate" TIMESTAMP(3),
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;
