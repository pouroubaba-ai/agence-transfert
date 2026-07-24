-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "withdrawalFeeBase" DOUBLE PRECISION,
ADD COLUMN     "withdrawalFeePerBase" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "withdrawalFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
