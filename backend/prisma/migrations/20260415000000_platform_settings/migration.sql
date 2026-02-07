-- CreateTable: PlatformSettings (singleton row)
CREATE TABLE "PlatformSettings" (
    "id"                       TEXT NOT NULL DEFAULT 'singleton',
    "gst_rate"                 DECIMAL(65,30) NOT NULL DEFAULT 12,
    "delivery_fee"             DECIMAL(65,30) NOT NULL DEFAULT 30,
    "free_delivery_threshold"  DECIMAL(65,30) NOT NULL DEFAULT 200,
    "cod_limit"                DECIMAL(65,30) NOT NULL DEFAULT 2000,
    "order_timeout_minutes"    INTEGER NOT NULL DEFAULT 30,
    "expiry_warn_60"           BOOLEAN NOT NULL DEFAULT true,
    "expiry_warn_30"           BOOLEAN NOT NULL DEFAULT true,
    "dead_stock_alert"         BOOLEAN NOT NULL DEFAULT true,
    "email_invoice"            BOOLEAN NOT NULL DEFAULT true,
    "sms_on_order"             BOOLEAN NOT NULL DEFAULT true,
    "updated_at"               TIMESTAMP(3) NOT NULL,
    "updated_by"               TEXT,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row so GET /admin/settings always returns a record
INSERT INTO "PlatformSettings" ("id", "updated_at")
VALUES ('singleton', NOW())
ON CONFLICT ("id") DO NOTHING;
