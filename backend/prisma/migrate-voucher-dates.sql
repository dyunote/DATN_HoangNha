-- ============================================================
-- Hoàng Nha Fashion — MIGRATION: voucher có ngày bắt đầu / kết thúc (HẠNG MỤC 4)
--
-- THAY ĐỔI trên bảng `vouchers`:
--   1. ĐỔI TÊN cột `expiry` → `end_date` (giữ nguyên toàn bộ dữ liệu — đây là
--      RENAME chứ không phải tạo cột mới rồi copy, nên không mất gì).
--   2. THÊM cột `start_date` DATETIME(3) NOT NULL.
--      Voucher CŨ được backfill '2000-01-01' = "đã có hiệu lực từ lâu", để mọi
--      mã đang chạy KHÔNG bị chết ngay sau khi migrate.
--
-- KHÔNG thêm bảng mới — CSDL vẫn đúng 13 bảng như ERD.
-- Script CHẠY LẠI ĐƯỢC NHIỀU LẦN (idempotent).
--
-- CÁCH CHẠY
--   mysql -u root hoangnha_fashion < prisma/migrate-voucher-dates.sql
-- SAU KHI CHẠY:
--   cd backend && npx prisma generate
-- ============================================================

-- ---------- 1. expiry → end_date ----------
SET @has_expiry := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers' AND COLUMN_NAME = 'expiry'
);
SET @has_end := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers' AND COLUMN_NAME = 'end_date'
);
-- Chỉ đổi tên khi còn `expiry` và CHƯA có `end_date`
SET @sql := IF(@has_expiry = 1 AND @has_end = 0,
  'ALTER TABLE `vouchers` CHANGE `expiry` `end_date` DATETIME(3) NOT NULL',
  'SELECT "vouchers.end_date đã sẵn sàng — bỏ qua bước đổi tên" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- 2. Thêm start_date ----------
SET @has_start := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers' AND COLUMN_NAME = 'start_date'
);
-- Thêm ở dạng NULL trước để không vỡ dòng cũ, backfill xong mới siết NOT NULL.
SET @sql := IF(@has_start = 0,
  'ALTER TABLE `vouchers` ADD COLUMN `start_date` DATETIME(3) NULL AFTER `min_order`',
  'SELECT "vouchers.start_date đã tồn tại — bỏ qua" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Voucher cũ: coi như đã có hiệu lực từ lâu, tránh chết mã đang chạy
UPDATE `vouchers` SET `start_date` = '2000-01-01 00:00:00.000' WHERE `start_date` IS NULL;

-- Siết lại NOT NULL cho khớp schema.prisma (chạy lại nhiều lần vẫn an toàn)
ALTER TABLE `vouchers` MODIFY COLUMN `start_date` DATETIME(3) NOT NULL;

-- ---------- 3. Cảnh báo dữ liệu sai (end_date <= start_date) ----------
SELECT COUNT(*) AS so_voucher_sai_khoang_ngay
FROM `vouchers` WHERE `end_date` <= `start_date`;

SELECT 'Migration ngày hiệu lực voucher: XONG' AS ket_qua;
