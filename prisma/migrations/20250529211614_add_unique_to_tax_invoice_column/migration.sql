/*
  Warnings:

  - A unique constraint covering the columns `[tax_invoice_number]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "invoices_tax_invoice_number_key" ON "invoices"("tax_invoice_number");
