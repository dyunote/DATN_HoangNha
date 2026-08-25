-- ============================================================
-- Hoàng Nha Fashion — SỬA DỮ LIỆU: voucher có giá trị giảm sai (HẠNG MỤC 10)
--
-- BỐI CẢNH
-- Trước khi có validate, admin lưu được voucher `percent` với value bất kỳ.
-- Trong DB thật đã tồn tại mã FREE: type='percent', value=200.
-- Công thức cũ `discount = subtotal * value / 100` cho ra số tiền giảm GẤP ĐÔI
-- giá trị đơn — khách lấy hàng miễn phí, chỉ trả phí ship.
--
-- Từ nay backend chặn cứng (lib/voucher.ts): percent 0–100, fixed > 0.
-- Ngoài ra computeDiscount() còn kẹp trần theo tạm tính nên kể cả dòng dữ liệu
-- sai còn sót cũng KHÔNG thể làm đơn về 0đ. Script này dọn nốt dữ liệu.
--
-- KHÔNG đụng bảng nào khác, KHÔNG thêm bảng — CSDL vẫn 13 bảng.
-- Script CHẠY LẠI ĐƯỢC NHIỀU LẦN (idempotent): lần sau không còn dòng nào khớp.
--
-- CÁCH CHẠY
--   mysql -u root hoangnha_fashion < prisma/migrate-voucher-value.sql
-- ============================================================

-- ---------- 1. Xem trước những dòng SẼ bị sửa ----------
SELECT id, code, type, value, 'se bi sua' AS ghi_chu
FROM `vouchers`
WHERE (type = 'percent' AND (value < 0 OR value > 100))
   OR (type = 'fixed'   AND value <= 0)
   OR (type = 'freeship' AND value <> 0)
   OR min_order < 0
   OR usage_limit < 1;

-- ---------- 2. percent ngoài khoảng 0–100 ----------
-- Kẹp về đúng khoảng: >100 hiểu là "giảm hết" (100%), âm hiểu là 0%.
-- Đây cũng chính là cách computeDiscount() diễn giải, nên dữ liệu và code khớp nhau.
UPDATE `vouchers` SET `value` = 100 WHERE `type` = 'percent' AND `value` > 100;
UPDATE `vouchers` SET `value` = 0   WHERE `type` = 'percent' AND `value` < 0;

-- ---------- 3. fixed <= 0 → vô nghĩa, chuyển về 0 lượt để admin tự dọn ----------
-- KHÔNG tự đoán số tiền giảm thay admin. Đặt end_date về quá khứ để mã ngừng
-- chạy ngay, admin vào sửa lại giá trị rồi mở hạn mới.
UPDATE `vouchers`
SET `end_date` = '2000-01-01 00:00:00.000'
WHERE `type` = 'fixed' AND `value` <= 0;

-- ---------- 4. freeship thì value phải là 0 ----------
UPDATE `vouchers` SET `value` = 0 WHERE `type` = 'freeship' AND `value` <> 0;

-- ---------- 5. Các giới hạn khác ----------
UPDATE `vouchers` SET `min_order` = 0 WHERE `min_order` < 0;
UPDATE `vouchers` SET `usage_limit` = GREATEST(1, `used_count`) WHERE `usage_limit` < 1;

-- ---------- 6. Kiểm tra lại: phải trả về 0 dòng ----------
SELECT COUNT(*) AS so_dong_con_sai
FROM `vouchers`
WHERE (type = 'percent' AND (value < 0 OR value > 100))
   OR (type = 'fixed'   AND value <= 0)
   OR (type = 'freeship' AND value <> 0)
   OR min_order < 0
   OR usage_limit < 1;

SELECT 'Dọn dữ liệu voucher sai: XONG' AS ket_qua;
