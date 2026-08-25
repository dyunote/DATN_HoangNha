-- ============================================================
-- Hoàng Nha Fashion — MIGRATION: đánh giá phải gắn với đơn hàng (HẠNG MỤC 11)
--
-- THÊM vào bảng `reviews`:
--   order_id VARCHAR(191) NULL  — đơn hàng chứng minh khách đã mua
--   + khóa ngoại tới orders(id) ON DELETE SET NULL
--   + UNIQUE (order_id, variant_id) — mỗi sản phẩm trên mỗi đơn đánh giá 1 lần
--
-- VÌ SAO NULL-ABLE: các đánh giá ĐÃ CÓ trong DB không gắn với đơn nào (viết
-- trước khi có ràng buộc này). Ép NOT NULL là phải bịa dữ liệu hoặc xóa review
-- cũ. Để NULL và coi chúng là "đánh giá cũ, không có badge Đã mua hàng".
-- MySQL cho phép NHIỀU dòng NULL trong unique index nên chúng không đụng nhau.
--
-- KHÔNG thêm bảng mới — CSDL vẫn đúng 13 bảng như ERD.
-- Script CHẠY LẠI ĐƯỢC NHIỀU LẦN (idempotent).
--
-- CÁCH CHẠY
--   mysql -u root hoangnha_fashion < prisma/migrate-review-order.sql
-- SAU KHI CHẠY:
--   cd backend && npx prisma generate
-- ============================================================

-- ---------- 1. Thêm cột order_id ----------
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND COLUMN_NAME = 'order_id'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE `reviews` ADD COLUMN `order_id` VARCHAR(191) NULL AFTER `variant_id`',
  'SELECT "reviews.order_id đã tồn tại — bỏ qua" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- 2. Backfill: nối đánh giá cũ với đơn ĐÃ GIAO tương ứng ----------
-- Nếu khách từng mua đúng biến thể đó trong một đơn đã giao thành công thì
-- gắn luôn, để đánh giá cũ cũng được badge "Đã mua hàng" thay vì mất trắng.
-- Lấy đơn CŨ NHẤT khớp để kết quả ổn định giữa các lần chạy.
UPDATE `reviews` r
JOIN (
  SELECT oi.variant_id, o.user_id, MIN(o.id) AS order_id
  FROM `order_items` oi
  JOIN `orders` o ON o.id = oi.order_id
  WHERE o.status = 'delivered'
  GROUP BY oi.variant_id, o.user_id
) m ON m.variant_id = r.variant_id AND m.user_id = r.user_id
SET r.`order_id` = m.order_id
WHERE r.`order_id` IS NULL;

-- ---------- 3. Gỡ trùng trước khi thêm UNIQUE ----------
-- Nếu backfill làm 2 đánh giá cùng trỏ vào (order_id, variant_id), giữ đánh
-- giá CŨ NHẤT, các bản sau trả về NULL (vẫn còn nội dung, chỉ mất badge).
UPDATE `reviews` r
JOIN (
  SELECT MIN(id) AS keep_id, order_id, variant_id
  FROM `reviews` WHERE order_id IS NOT NULL
  GROUP BY order_id, variant_id HAVING COUNT(*) > 1
) d ON d.order_id = r.order_id AND d.variant_id = r.variant_id AND r.id <> d.keep_id
SET r.`order_id` = NULL;

-- ---------- 4. Khóa ngoại ----------
SET @fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'
    AND CONSTRAINT_NAME = 'reviews_order_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE `reviews` ADD CONSTRAINT `reviews_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT "FK reviews.order_id đã tồn tại — bỏ qua" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- 5. UNIQUE (order_id, variant_id) ----------
SET @uq := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'
    AND INDEX_NAME = 'reviews_order_id_variant_id_key'
);
SET @sql := IF(@uq = 0,
  'ALTER TABLE `reviews` ADD UNIQUE INDEX `reviews_order_id_variant_id_key` (`order_id`, `variant_id`)',
  'SELECT "UNIQUE (order_id, variant_id) đã tồn tại — bỏ qua" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) AS review_co_don, (SELECT COUNT(*) FROM `reviews` WHERE order_id IS NULL) AS review_khong_co_don
FROM `reviews` WHERE order_id IS NOT NULL;
SELECT 'Migration đánh giá gắn đơn hàng: XONG' AS ket_qua;
