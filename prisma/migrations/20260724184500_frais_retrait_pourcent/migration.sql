-- Remplace le barème "base/perBase" du frais de retrait par un simple pourcentage.
ALTER TABLE "Channel" DROP COLUMN IF EXISTS "withdrawalFeeBase";
ALTER TABLE "Channel" DROP COLUMN IF EXISTS "withdrawalFeePerBase";
ALTER TABLE "Channel" ADD COLUMN "withdrawalFeePercent" DOUBLE PRECISION;
