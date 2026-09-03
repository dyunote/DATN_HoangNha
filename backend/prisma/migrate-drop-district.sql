-- ============================================================
-- Hoàng Nha Fashion — MIGRATION: bỏ cấp "Quận / Huyện" khỏi sổ địa chỉ
--
-- BỐI CẢNH
-- Từ 01/07/2025 Việt Nam bỏ cấp huyện: địa chỉ hành chính chỉ còn HAI cấp
--   Tỉnh / Thành phố  →  Phường / Xã
-- Bảng `addresses` đang lưu cả `ward` lẫn `district` nên sai chuẩn và bắt
-- khách nhập thừa một ô.
--
-- Bỏ 1 cột khỏi bảng `addresses`:
--   district  varchar(191)  →  XOÁ
--
-- VÌ SAO PHẢI CHẠY UPDATE TRƯỚC KHI DROP
-- `DROP COLUMN` xoá dữ liệu VĨNH VIỄN, không hoàn tác được. Trong DB thật có
-- những dòng khách chỉ nhập quận mà bỏ trống phường (ward = '' nhưng
-- district = 'quận 12'). Drop thẳng là mất luôn địa danh đó → đơn giao sau
-- này thiếu một cấp, shipper không biết đường. Nên bước 2 kéo giá trị
-- `district` sang `ward` cho ĐÚNG những dòng `ward` đang rỗng (không ghi đè
-- dòng đã có phường), xong rồi bước 3 mới drop.
--
-- KHÔNG đụng vào `orders.address_text`: chuỗi đó đã "đóng băng" lúc đặt hàng,
-- đơn cũ phải giữ nguyên địa chỉ tại thời điểm mua.
--
-- KHÔNG thêm/bớt bảng — CSDL vẫn đúng 13 bảng như ERD.
--
-- Script CHẠY LẠI ĐƯỢC NHIỀU LẦN (idempotent): kiểm tra information_schema
-- trước, cột đã bị xoá rồi thì bỏ qua.
--
-- CÁCH CHẠY
--   mysql -u root hoangnha_fashion < prisma/migrate-drop-district.sql
--   hoặc: phpMyAdmin → DB hoangnha_fashion → tab SQL → dán → Go
--
-- SAU KHI CHẠY:
--   cd backend && npx prisma generate
-- ============================================================

-- ---------- 1. Xem trước những dòng SẼ được gộp dữ liệu ----------
SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'addresses' AND COLUMN_NAME = 'district'
);
SET @sql := IF(@has_col = 1,
  'SELECT id, street, ward, district, city, ''se gop district vao ward'' AS ghi_chu
     FROM `addresses` WHERE `ward` = '''' AND `district` <> ''''',
  'SELECT "addresses.district da bi xoa — bo qua buoc xem truoc" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- 2. Gộp dữ liệu cũ vào `ward` (chống mất dữ liệu) ----------
SET @sql := IF(@has_col = 1,
  'UPDATE `addresses` SET `ward` = `district` WHERE `ward` = '''' AND `district` <> ''''',
  'SELECT "Khong con cot district — bo qua UPDATE" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- 3. Xoá cột ----------
SET @sql := IF(@has_col = 1,
  'ALTER TABLE `addresses` DROP COLUMN `district`',
  'SELECT "addresses.district da bi xoa — bo qua DROP" AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------- 4. Kiểm chứng: phải trả về 0 ----------
SELECT COUNT(*) AS con_sot_cot_district
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'addresses' AND COLUMN_NAME = 'district';

-- ---------- 5. Xem lại sổ địa chỉ sau khi dọn ----------
SELECT id, street, ward, city FROM `addresses` ORDER BY id;

SELECT 'Migration bo cap Quan/Huyen: XONG' AS ket_qua;
