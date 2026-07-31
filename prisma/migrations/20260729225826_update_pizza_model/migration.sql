/*
  Warnings:

  - Added the required column `addedAt` to the `Pizza` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Pizza` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `Pizza` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pizza" ADD COLUMN     "addedAt" INTEGER NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "ingredients" TEXT[],
ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL;
