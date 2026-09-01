-- ============================================================
-- Hoàng Nha Fashion — MIGRATION: "Hàng mới về" ⊕ "Đang giảm giá"
--
-- QUY TẮC MỚI: một sản phẩm không thể vừa gắn nhãn NEW vừa đang giảm giá.
-- Từ giờ API đã chặn (backend/src/routes/admin.ts), nhưng dữ liệu ĐANG CÓ
-- trong DB có thể đã dính cả hai từ trước.
--
-- Script này TẮT cờ `is_new` cho những sản phẩm đang chạy sale.
-- Chọn giữ giá sale và bỏ nhãn NEW (chứ không phải ngược lại) vì: giá là tiền
-- thật khách đang nhìn thấy, còn NEW chỉ là nhãn marketing — xóa nhầm giá gốc
-- là hỏng chương trình khuyến mãi, tắt nhầm cờ thì bật lại một cú click.
--
-- KHÔNG bắt buộc chạy: giao diện đã tự ẩn badge NEW khi sản phẩm đang sale.
-- Nhưng nên chạy, để trạng thái trong DB khớp với thứ khách nhìn thấy — nếu
-- không, hôm nào gỡ sale ra là badge NEW lại nhảy về dù hàng đã cũ.
--
-- Script CHẠY LẠI ĐƯỢC NHIỀU LẦN (idempotent).
--
-- CÁCH CHẠY
--   mysql -u root hoangnha_fashion < prisma/migrate-new-vs-sale.sql
--   hoặc: phpMyAdmin → DB hoangnha_fashion → tab SQL → dán → Go
-- ============================================================

-- ---------- 1. Sale đặt ở cấp SẢN PHẨM ----------
UPDATE `products`
SET `is_new` = 0
WHERE `is_new` = 1
  AND `old_price` IS NOT NULL
  AND `old_price` > `price`;

-- ---------- 2. Sale đặt riêng ở từng BIẾN THỂ ----------
-- Biến thể không có giá riêng (price NULL) thì so với giá sản phẩm.
UPDATE `products` p
SET p.`is_new` = 0
WHERE p.`is_new` = 1
  AND EXISTS (
    SELECT 1 FROM `variants` v
    WHERE v.`product_id` = p.`id`
      AND v.`old_price` IS NOT NULL
      AND v.`old_price` > COALESCE(v.`price`, p.`price`)
  );

-- ---------- 3. Còn sót sản phẩm nào vi phạm không? ----------
SELECT COUNT(*) AS con_vi_pham
FROM `products` p
WHERE p.`is_new` = 1
  AND (
    (p.`old_price` IS NOT NULL AND p.`old_price` > p.`price`)
    OR EXISTS (
      SELECT 1 FROM `variants` v
      WHERE v.`product_id` = p.`id`
        AND v.`old_price` IS NOT NULL
        AND v.`old_price` > COALESCE(v.`price`, p.`price`)
    )
  );

SELECT 'Migration NEW vs SALE: XONG' AS ket_qua;
