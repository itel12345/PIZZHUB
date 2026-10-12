-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailMarketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsMarketingOptIn" BOOLEAN NOT NULL DEFAULT false;
