/*
  Warnings:

  - You are about to drop the column `createdAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `ammount` on the `invoice_details` table. All the data in the column will be lost.
  - You are about to drop the column `item` on the `invoice_details` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `invoice_details` table. All the data in the column will be lost.
  - You are about to drop the column `usage` on the `invoice_details` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[client_name]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `invoice_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `delivery_count` to the `invoice_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_per_delivery` to the `invoice_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_note` to the `invoice_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `invoice_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "invoice_details" DROP COLUMN "ammount",
DROP COLUMN "item",
DROP COLUMN "price",
DROP COLUMN "usage",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "delivery_count" TEXT NOT NULL,
ADD COLUMN     "price_per_delivery" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "transaction_note" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_name_key" ON "clients"("client_name");
