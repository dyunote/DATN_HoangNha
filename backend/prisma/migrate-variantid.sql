-- ============================================================
-- Hoàng Nha Fashion — MIGRATION: đưa DB cũ lên schema 15 bảng bản mới
-- KHÔNG mất dữ liệu (không dùng --force-reset)
--
-- BỐI CẢNH
-- Schema mới khai báo OrderItem.variantId và CartItem.variantId là BẮT BUỘC
-- (Int, không có dấu ?). MySQL không thể thêm một cột NOT NULL vào bảng đã có
-- dữ liệu mà không biết điền gì cho các dòng cũ → `prisma db push` dừng lại và
-- đề nghị --force-reset (xóa sạch DB). Script này làm thay việc đó.
--
-- NGUYÊN TẮC (dùng lại được cho mọi lần thêm cột NOT NULL vào bảng có data):
--   1. Thêm cột ở dạng NULL trước (luôn thành công, không đụng dòng cũ)
--   2. UPDATE ... JOIN để điền giá trị cho dòng cũ
--   3. Mới siết lại thành NOT NULL + thêm khóa ngoại
--
-- Script CHẠY LẠI ĐƯỢC NHIỀU LẦN (idempotent): mọi thao tác đều kiểm tra
-- information_schema trước, đã có rồi thì bỏ qua. Nếu lần chạy trước đứt giữa
-- chừng, cứ chạy lại từ đầu.
--
-- CÁCH CHẠY
--   mysql -u root hoangnha_fashion < prisma/migrate-variantid.sql
--   hoặc: phpMyAdmin → chọn DB hoangnha_fashion → tab SQL → dán → Go
--
-- SAU KHI CHẠY (bắt buộc):
--   cd backend
--   npx prisma db push      -- phải báo "already in sync", KHÔNG hỏi force-reset
--   npx prisma generate
-- ============================================================

USE `hoangnha_fashion`;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- PHẦN 0: THỦ TỤC PHỤ TRỢ
-- MySQL không có "ALTER TABLE ... ADD COLUMN IF NOT EXISTS" chuẩn, nên ta tự
-- viết: đọc bảng hệ thống information_schema xem thứ cần thêm đã tồn tại chưa,
-- có rồi thì thôi. PREPARE/EXECUTE là cách chạy một câu SQL dựng từ chuỗi.
-- ============================================================

DROP PROCEDURE IF EXISTS `hn_add_column`;
DROP PROCEDURE IF EXISTS `hn_drop_column`;
DROP PROCEDURE IF EXISTS `hn_add_index`;
DROP PROCEDURE IF EXISTS `hn_drop_index`;
DROP PROCEDURE IF EXISTS `hn_add_fk`;

DELIMITER $$

-- Thêm cột nếu chưa có. VD: CALL hn_add_column('OrderItem','variantId','INT NULL');
CREATE PROCEDURE `hn_add_column`(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', def);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$

-- Xóa cột nếu còn tồn tại (dùng cho color/size cũ của CartItem)
CREATE PROCEDURE `hn_drop_column`(IN tbl VARCHAR(64), IN col VARCHAR(64))
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP COLUMN `', col, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$

-- Thêm index/unique nếu chưa có. kind = '' (index thường) hoặc 'UNIQUE'
CREATE PROCEDURE `hn_add_index`(IN tbl VARCHAR(64), IN idx VARCHAR(64), IN cols TEXT, IN kind VARCHAR(10))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND INDEX_NAME = idx
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD ', kind, ' INDEX `', idx, '` (', cols, ')');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$

-- Xóa index nếu còn (dùng cho unique key cũ của CartItem)
CREATE PROCEDURE `hn_drop_index`(IN tbl VARCHAR(64), IN idx VARCHAR(64))
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND INDEX_NAME = idx
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP INDEX `', idx, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$

-- Thêm khóa ngoại nếu chưa có
CREATE PROCEDURE `hn_add_fk`(
  IN tbl VARCHAR(64), IN fk VARCHAR(64), IN col VARCHAR(64),
  IN refTbl VARCHAR(64), IN refCol VARCHAR(64), IN onDel VARCHAR(20))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl
      AND CONSTRAINT_NAME = fk AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD CONSTRAINT `', fk,
                    '` FOREIGN KEY (`', col, '`) REFERENCES `', refTbl, '`(`', refCol,
                    '`) ON DELETE ', onDel, ' ON UPDATE CASCADE');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$

DELIMITER ;

-- ============================================================
-- PHẦN 1: OrderItem.variantId  (Int — BẮT BUỘC)
-- Đây chính là cột làm `prisma db push` báo lỗi "8 rows".
-- ============================================================

CALL hn_add_column('OrderItem', 'variantId', 'INT NULL');

-- 1a. Dòng cũ lưu color/size dạng chuỗi → dò đúng biến thể của sản phẩm đó.
--     Ghép được nhờ Variant có UNIQUE(productId, color, size).
UPDATE `OrderItem` oi
JOIN `Variant` v
  ON  v.`productId` = oi.`productId`
  AND v.`color`     = oi.`color`
  AND v.`size`      = oi.`size`
SET oi.`variantId` = v.`id`
WHERE oi.`variantId` IS NULL;

-- 1b. Dòng không khớp (biến thể bị admin xóa / đổi tên màu sau khi khách mua):
--     tạm gán biến thể đầu tiên của chính sản phẩm đó cho hợp lệ NOT NULL.
--     Hóa đơn cũ vẫn in đúng vì color/size trong OrderItem là SNAPSHOT riêng.
UPDATE `OrderItem` oi
JOIN (
  SELECT `productId`, MIN(`id`) AS `firstVariant` FROM `Variant` GROUP BY `productId`
) f ON f.`productId` = oi.`productId`
SET oi.`variantId` = f.`firstVariant`
WHERE oi.`variantId` IS NULL;

-- 1c. Dòng trỏ tới sản phẩm đã bị xóa hẳn (không còn variant nào) thì không cứu
--     được — xóa để không chặn bước siết NOT NULL. Bình thường là 0 dòng.
DELETE FROM `OrderItem` WHERE `variantId` IS NULL;

ALTER TABLE `OrderItem` MODIFY COLUMN `variantId` INT NOT NULL;
CALL hn_add_index('OrderItem', 'OrderItem_variantId_idx', '`variantId`', '');
CALL hn_add_fk('OrderItem', 'OrderItem_variantId_fkey', 'variantId', 'Variant', 'id', 'RESTRICT');

-- ============================================================
-- PHẦN 2: CartItem — thay (color, size) bằng variantId
-- Bảng cũ: UNIQUE(userId, productId, color, size) + 2 cột chuỗi color/size
-- Bảng mới: UNIQUE(userId, variantId), bỏ hẳn color/size
-- ============================================================

CALL hn_add_column('CartItem', 'variantId', 'INT NULL');

-- 2a. Dò theo color/size cũ — chỉ chạy nếu 2 cột đó còn tồn tại.
--     Phải bọc trong PREPARE: nếu cột đã bị xóa ở lần chạy trước, câu UPDATE
--     tham chiếu ci.color sẽ lỗi ngay lúc phân tích cú pháp, không bỏ qua được.
SET @hasColorSize = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CartItem' AND COLUMN_NAME IN ('color','size')
);
SET @s = IF(@hasColorSize = 2,
  'UPDATE `CartItem` ci JOIN `Variant` v
     ON v.`productId` = ci.`productId` AND v.`color` = ci.`color` AND v.`size` = ci.`size`
   SET ci.`variantId` = v.`id` WHERE ci.`variantId` IS NULL',
  'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- 2b. Giỏ hàng là dữ liệu TẠM — dòng nào không dò được biến thể thì xóa luôn,
--     khách chỉ việc thêm lại. Không cần đoán mò như OrderItem (là hóa đơn).
DELETE FROM `CartItem` WHERE `variantId` IS NULL;

-- 2c. Gộp trùng trước khi thêm UNIQUE(userId, variantId): nếu 2 dòng cũ cùng
--     đổ về một biến thể thì cộng số lượng vào dòng id nhỏ nhất rồi xóa dòng dư.
--     Không làm bước này, lệnh ADD UNIQUE ở 2e sẽ fail vì đụng khóa trùng.
UPDATE `CartItem` c
JOIN (
  SELECT `userId`, `variantId`, MIN(`id`) AS keepId, SUM(`quantity`) AS totalQty
  FROM `CartItem` GROUP BY `userId`, `variantId` HAVING COUNT(*) > 1
) d ON d.keepId = c.`id`
SET c.`quantity` = d.totalQty;

DELETE c FROM `CartItem` c
JOIN (
  SELECT `userId`, `variantId`, MIN(`id`) AS keepId
  FROM `CartItem` GROUP BY `userId`, `variantId`
) d ON d.`userId` = c.`userId` AND d.`variantId` = c.`variantId`
WHERE c.`id` <> d.keepId;

-- 2d. Siết NOT NULL + khóa ngoại
ALTER TABLE `CartItem` MODIFY COLUMN `variantId` INT NOT NULL;
CALL hn_add_index('CartItem', 'CartItem_variantId_idx', '`variantId`', '');
CALL hn_add_fk('CartItem', 'CartItem_variantId_fkey', 'variantId', 'Variant', 'id', 'CASCADE');

-- 2e. Đổi ràng buộc unique: bỏ khóa cũ theo chuỗi, thêm khóa mới theo biến thể
CALL hn_drop_index('CartItem', 'CartItem_userId_productId_color_size_key');
CALL hn_add_index('CartItem', 'CartItem_userId_variantId_key', '`userId`, `variantId`', 'UNIQUE');

-- 2f. Bỏ 2 cột chuỗi cũ — giờ suy ra từ variant bằng JOIN, giữ lại là dữ liệu thừa
CALL hn_drop_column('CartItem', 'color');
CALL hn_drop_column('CartItem', 'size');

-- ============================================================
-- PHẦN 3: Review.variantId  (Int? — CHO PHÉP NULL nên đơn giản hẳn)
-- Không cần backfill bắt buộc: NULL = "đánh giá chung, không gắn biến thể nào".
-- ============================================================

CALL hn_add_column('Review', 'variantId', 'INT NULL');
CALL hn_add_index('Review', 'Review_variantId_idx', '`variantId`', '');
CALL hn_add_fk('Review', 'Review_variantId_fkey', 'variantId', 'Variant', 'id', 'SET NULL');

-- Tiện tay: đánh giá nào của khách đã từng mua sản phẩm đó thì gắn luôn biến thể
-- họ mua, để giao diện hiện được "Đã mua: Đen / M" trên dữ liệu sẵn có.
UPDATE `Review` r
JOIN `Order` o      ON o.`userId`   = r.`userId`
JOIN `OrderItem` oi ON oi.`orderId` = o.`id` AND oi.`productId` = r.`productId`
SET r.`variantId` = oi.`variantId`
WHERE r.`variantId` IS NULL;

-- ============================================================
-- PHẦN 4: SepayWebhookLog.orderId  (String? — nullable)
-- Webhook có thể về trước khi biết thuộc đơn nào, nên phải để NULL được.
-- ============================================================

CALL hn_add_column('SepayWebhookLog', 'orderId', 'VARCHAR(191) NULL');
CALL hn_add_index('SepayWebhookLog', 'SepayWebhookLog_orderId_idx', '`orderId`', '');
CALL hn_add_fk('SepayWebhookLog', 'SepayWebhookLog_orderId_fkey', 'orderId', 'Order', 'id', 'SET NULL');

-- Backfill: log cũ chỉ lưu payCode → tra ngược ra đơn qua bảng Payment
UPDATE `SepayWebhookLog` w
JOIN `Payment` p ON p.`payCode` = w.`payCode`
SET w.`orderId` = p.`orderId`
WHERE w.`orderId` IS NULL AND w.`payCode` IS NOT NULL;

-- ============================================================
-- PHẦN 5: Notification.orderId + voucherId  (đều nullable)
-- Thông báo hệ thống không thuộc đơn hay voucher nào → phải cho NULL.
-- ============================================================

CALL hn_add_column('Notification', 'orderId',   'VARCHAR(191) NULL');
CALL hn_add_column('Notification', 'voucherId', 'INT NULL');
CALL hn_add_index('Notification', 'Notification_orderId_idx',   '`orderId`',   '');
CALL hn_add_index('Notification', 'Notification_voucherId_idx', '`voucherId`', '');
CALL hn_add_fk('Notification', 'Notification_orderId_fkey',   'orderId',   'Order',   'id', 'CASCADE');
CALL hn_add_fk('Notification', 'Notification_voucherId_fkey', 'voucherId', 'Voucher', 'id', 'SET NULL');

-- ============================================================
-- DỌN DẸP
-- ============================================================

DROP PROCEDURE IF EXISTS `hn_add_column`;
DROP PROCEDURE IF EXISTS `hn_drop_column`;
DROP PROCEDURE IF EXISTS `hn_add_index`;
DROP PROCEDURE IF EXISTS `hn_drop_index`;
DROP PROCEDURE IF EXISTS `hn_add_fk`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- KIỂM TRA — cả 5 dòng phải trả về 'OK'
-- ============================================================

SELECT 'OrderItem.variantId' AS mucKiemTra,
       IF(SUM(`variantId` IS NULL) = 0, 'OK', CONCAT('LOI: con ', SUM(`variantId` IS NULL), ' dong NULL')) AS ketQua
FROM `OrderItem`
UNION ALL
SELECT 'CartItem.variantId',
       IF(SUM(`variantId` IS NULL) = 0, 'OK', 'LOI') FROM `CartItem`
UNION ALL
SELECT 'Review.variantId (cot ton tai)',
       IF(COUNT(*) = 1, 'OK', 'LOI: chua co cot') FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Review' AND COLUMN_NAME = 'variantId'
UNION ALL
SELECT 'CartItem da bo color/size',
       IF(COUNT(*) = 0, 'OK', 'LOI: cot cu van con') FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CartItem' AND COLUMN_NAME IN ('color','size')
UNION ALL
SELECT 'Notification.orderId + voucherId',
       IF(COUNT(*) = 2, 'OK', 'LOI: thieu cot') FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Notification' AND COLUMN_NAME IN ('orderId','voucherId');
