/*
  Warnings:

  - You are about to drop the column `isActive` on the `Monitor` table. All the data in the column will be lost.
  - You are about to drop the `CheckResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CheckResult" DROP CONSTRAINT "CheckResult_monitorId_fkey";

-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "isActive";

-- DropTable
DROP TABLE "CheckResult";
