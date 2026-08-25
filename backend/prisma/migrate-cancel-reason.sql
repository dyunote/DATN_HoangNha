-- ============================================================
-- Hoàng Nha Fashion — MIGRATION: lý do hủy đơn (HẠNG MỤC 1)
--
-- Thêm 3 cột vào bảng `orders`:
--   cancel_reason  TEXT      NULL — lý do khách/admin nhập khi hủy
--   cancelled_by   VARCHAR   NULL — 'user' hoặc 'admin'
--   cancelled_at   DATETIME  NULL — thời điểm hủy
--
-- KHÔNG mất dữ liệu: cả ba đều NULL-able nên đơn cũ giữ nguyên, chỉ là
-- các đơn đã hủy TRƯỚC khi có tính năng này sẽ không có lý do (hiển thị
-- "Không ghi nhận lý do" ở giao diện).
--
-- KHÔNG thêm bảng mới — CSDL vẫn đúng 13 bảng như ERD.
--
-- Script CHẠY LẠI ĐƯỢC NHIỀU LẦN (idempotent): kiểm tra information_schema
-- trước, cột đã tồn tại thì bỏ qua.
--
-- CÁCH CHẠY
--   mysql -u root hoangnha_fashion < prisma/migrate-cancel-reason.sql
--   hoặc: phpMyAdmin → DB hoangnha_fashion → tab SQL → dán → Go
--
-- SAU KHI CHẠY:
--   cd backend && npx prisma generate
-- ============================================================

-- ---------- 1. cancel_reason ----------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cancel_reason'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE `orders` ADD COLUMN `cancel_reason` TEXT NULL AFTER `delivered_at`',
  'SELECT "orders.cancel_reason đã tồn tại — bỏ qua" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- 2. cancelled_by ----------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cancelled_by'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE `orders` ADD COLUMN `cancelled_by` VARCHAR(191) NULL AFTER `cancel_reason`',
  'SELECT "orders.cancelled_by đã tồn tại — bỏ qua" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- 3. cancelled_at ----------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cancelled_at'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE `orders` ADD COLUMN `cancelled_at` DATETIME(3) NULL AFTER `cancelled_by`',
  'SELECT "orders.cancelled_at đã tồn tại — bỏ qua" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- 4. Backfill cho đơn ĐÃ hủy trước khi có tính năng ----------
-- Không bịa lý do, chỉ ghi nhận thời điểm ước lượng = ngày tạo đơn để
-- giao diện không hiện ô trống khó hiểu.
UPDATE `orders`
SET `cancelled_at` = `created_at`
WHERE `status` = 'cancelled' AND `cancelled_at` IS NULL;

SELECT 'Migration lý do hủy đơn: XONG' AS ket_qua;
