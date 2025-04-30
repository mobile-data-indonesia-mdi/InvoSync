-- CreateTable
CREATE TABLE "logs" (
    "log_id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "acces_token" TEXT,
    "username" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL,
    "status_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("log_id")
);
