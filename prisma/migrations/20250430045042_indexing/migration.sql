-- CreateIndex
CREATE INDEX "clients_client_id_idx" ON "clients"("client_id");

-- CreateIndex
CREATE INDEX "invoice_details_invoice_detail_id_idx" ON "invoice_details"("invoice_detail_id");

-- CreateIndex
CREATE INDEX "invoices_invoice_id_invoice_number_idx" ON "invoices"("invoice_id", "invoice_number");

-- CreateIndex
CREATE INDEX "logs_created_at_log_id_username_idx" ON "logs"("created_at", "log_id", "username");

-- CreateIndex
CREATE INDEX "payments_payment_id_idx" ON "payments"("payment_id");

-- CreateIndex
CREATE INDEX "users_user_id_idx" ON "users"("user_id");
