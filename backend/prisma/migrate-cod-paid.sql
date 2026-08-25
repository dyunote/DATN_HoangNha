-- ============================================================
-- Hoàng Nha Fashion — SỬA DỮ LIỆU: đơn COD đã giao nhưng chưa đánh dấu thu tiền
--
-- BỐI CẢNH
-- COD nghĩa là "thu tiền khi giao hàng": giao THÀNH CÔNG tức là shipper đã thu
-- đủ tiền (không thu được thì trạng thái phải là "giao thất bại").
-- Nhưng hệ thống chưa từng có chỗ nào đánh dấu điều đó, nên payment_status của
-- đơn COD nằm mãi ở 'pending'.
--
-- HẬU QUẢ: doanh thu chỉ tính đơn (status='delivered' AND payment_status='paid')
-- nên đơn COD KHÔNG BAO GIỜ được ghi nhận → dashboard luôn thiếu tiền so với
-- danh sách đơn hàng. Trên DB thật, 3 đơn COD đã giao bị bỏ sót 2.300.555đ.
--
-- Từ nay backend tự set paid khi chuyển đơn COD sang 'delivered'
-- (routes/admin.ts). Script này dọn các đơn ĐÃ giao từ trước.
--
-- CHỈ đụng đơn COD + đã giao + chưa đánh dấu trả tiền. KHÔNG đụng đơn chuyển
-- khoản (tiền có thể thật sự chưa về, phải để admin đối soát).
-- KHÔNG thêm bảng — CSDL vẫn 13 bảng.
-- Script CHẠY LẠI ĐƯỢC NHIỀU LẦN (idempotent).
--
-- CÁCH CHẠY
--   mysql -u root hoangnha_fashion < prisma/migrate-cod-paid.sql
-- ============================================================

-- ---------- 1. Xem trước những đơn SẼ được đánh dấu ----------
SELECT id, payment_method, status, payment_status, total, 'se danh dau da thu tien' AS ghi_chu
FROM `orders`
WHERE `payment_method` = 'cod' AND `status` = 'delivered' AND `payment_status` <> 'paid';

-- ---------- 2. Đánh dấu đã thu tiền ----------
-- paid_at lấy theo delivered_at (thời điểm shipper giao & thu tiền), không có
-- thì lùi về created_at — KHÔNG dùng NOW() vì sẽ ghi sai ngày vào báo cáo
-- doanh thu theo tháng.
UPDATE `orders`
SET `payment_status`   = 'paid',
    `paid_at`          = COALESCE(`delivered_at`, `created_at`),
    `transaction_code` = COALESCE(`transaction_code`, CONCAT('COD-BACKFILL-', `id`))
WHERE `payment_method` = 'cod'
  AND `status`         = 'delivered'
  AND `payment_status` <> 'paid';

-- ---------- 3. Kiểm tra lại: phải trả về 0 ----------
SELECT COUNT(*) AS con_sot_don_cod_chua_thu_tien
FROM `orders`
WHERE `payment_method` = 'cod' AND `status` = 'delivered' AND `payment_status` <> 'paid';

-- ---------- 4. Doanh thu sau khi dọn ----------
SELECT COALESCE(SUM(subtotal - discount), 0) AS doanh_thu_moi, COUNT(*) AS so_don
FROM `orders` WHERE `status` = 'delivered' AND `payment_status` = 'paid';

SELECT 'Don du lieu COD da giao: XONG' AS ket_qua;
