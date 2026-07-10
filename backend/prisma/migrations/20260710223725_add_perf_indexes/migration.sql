-- Performance optimization: add missing indexes for common query patterns

-- Index on Order(status, created_at) — enables fast date-range + status filters
CREATE INDEX IF NOT EXISTS "Order_status_created_at_idx" ON "Order"("status", "created_at");

-- Index on PharmacyStore(status) — enables fast status lookup for dashboard
CREATE INDEX IF NOT EXISTS "PharmacyStore_status_idx" ON "PharmacyStore"("status");

-- Index on User(role, is_active) — enables fast admin/consumer count queries
CREATE INDEX IF NOT EXISTS "User_role_is_active_idx" ON "User"("role", "is_active");
