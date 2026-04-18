-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PENDING', 'COMPLETED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "refund_status" "RefundStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "orders" ADD COLUMN "refunded_at" TIMESTAMP(3);
