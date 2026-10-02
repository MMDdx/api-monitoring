/*
  Warnings:

  - The values [UP,DOWN] on the enum `MonitorStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MonitorStatus_new" AS ENUM ('ACTIVE', 'PAUSED');
ALTER TABLE "public"."Monitor" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Monitor" ALTER COLUMN "status" TYPE "MonitorStatus_new" USING ("status"::text::"MonitorStatus_new");
ALTER TYPE "MonitorStatus" RENAME TO "MonitorStatus_old";
ALTER TYPE "MonitorStatus_new" RENAME TO "MonitorStatus";
DROP TYPE "public"."MonitorStatus_old";
ALTER TABLE "Monitor" ALTER COLUMN "status" SET DEFAULT 'PAUSED';
COMMIT;
