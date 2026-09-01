-- ============================================================
-- Hoàng Nha Fashion — MIGRATION: danh sách yêu thích đồng bộ đa thiết bị
--
-- Thêm 1 cột vào bảng `users`:
--   wishlist  JSON  NULL — mảng product_id, vd: [12, 7, 30]
--
-- VÌ SAO KHÔNG TẠO BẢNG `wishlists`: CSDL phải giữ đúng 13 bảng theo ERD.
-- Yêu thích chỉ là một tập id, không có thuộc tính riêng (không số lượng,
-- không giá, không biến thể) và không có màn hình nào hỏi ngược "ai đang
-- thích sản phẩm X" — nên một cột JSON trên chính user là đủ.
--
-- KHÔNG mất dữ liệu: cột NULL-able, user cũ giữ nguyên và được hiểu là
-- "chưa thích sản phẩm nào". Danh sách đang nằm trong localStorage của khách
-- sẽ tự được gộp lên đây ở lần đăng nhập kế tiếp (xem WishlistContext.tsx).
--
-- Script CHẠY LẠI ĐƯỢC NHIỀU LẦN (idempotent): kiểm tra information_schema
-- trước, cột đã tồn tại thì bỏ qua.
--
-- CÁCH CHẠY
--   mysql -u root hoangnha_fashion < prisma/migrate-wishlist.sql
--   hoặc: phpMyAdmin → DB hoangnha_fashion → tab SQL → dán → Go
--
-- SAU KHI CHẠY:
--   cd backend && npx prisma generate
-- ============================================================

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'wishlist'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE `users` ADD COLUMN `wishlist` JSON NULL AFTER `created_at`',
  'SELECT "users.wishlist đã tồn tại — bỏ qua" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration wishlist: XONG' AS ket_qua;
