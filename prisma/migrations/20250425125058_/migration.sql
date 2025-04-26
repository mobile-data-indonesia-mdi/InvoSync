/*
  Warnings:

  - You are about to drop the column `voidedAt` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `voidedAt` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "voidedAt",
ADD COLUMN     "voided_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "voidedAt",
ADD COLUMN     "voided_at" TIMESTAMP(3);
