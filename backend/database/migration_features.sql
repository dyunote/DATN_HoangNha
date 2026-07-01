-- ============================================================
-- HOANG NHA - MIGRATION: tinh nang moi
--   1) Wishlist (luot thich)
--   2) Tich chon san pham trong gio hang
--   3) Phi van chuyen theo km (tinh/mien)
--   4) Thanh toan chuyen khoan qua SePay
--   5) Voucher: gia tri don toi thieu
-- ============================================================
-- File nay KHONG xoa du lieu cu. Chay tren DB hoang nha da co.
-- Cach chay:  mysql -u root -p hoangnha < migration_features.sql
-- ============================================================

USE hoangnha;

-- ------------------------------------------------------------
-- 1) WISHLIST (luot thich san pham)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
  INDEX idx_wishlists_product (product_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2) CART ITEMS: them cot tich chon (mac dinh la da chon)
-- ------------------------------------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hoangnha' AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'is_selected'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE cart_items ADD COLUMN is_selected TINYINT(1) NOT NULL DEFAULT 1 AFTER quantity',
  'SELECT "cart_items.is_selected da ton tai" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 3) ORDERS: them thong tin van chuyen
-- ------------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='orders' AND COLUMN_NAME='subtotal');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE orders ADD COLUMN subtotal DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER note',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='orders' AND COLUMN_NAME='discount_amount');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER subtotal',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='orders' AND COLUMN_NAME='shipping_fee');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER discount_amount',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='orders' AND COLUMN_NAME='province');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE orders ADD COLUMN province VARCHAR(100) DEFAULT NULL AFTER shipping_fee',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='orders' AND COLUMN_NAME='shipping_distance_km');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE orders ADD COLUMN shipping_distance_km DECIMAL(8,2) DEFAULT NULL AFTER province',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ------------------------------------------------------------
-- 4) PAYMENTS: them truong phuc vu SePay (chong trung, doi soat)
-- ------------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='payments' AND COLUMN_NAME='transfer_code');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE payments ADD COLUMN transfer_code VARCHAR(50) DEFAULT NULL AFTER method',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='payments' AND COLUMN_NAME='amount');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE payments ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER transfer_code',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='payments' AND COLUMN_NAME='transaction_id');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(50) DEFAULT NULL AFTER status',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='payments' AND COLUMN_NAME='gateway');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE payments ADD COLUMN gateway VARCHAR(100) DEFAULT NULL AFTER transaction_id',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='payments' AND COLUMN_NAME='reference_code');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE payments ADD COLUMN reference_code VARCHAR(100) DEFAULT NULL AFTER gateway',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- transaction_id phai duy nhat de chong xu ly trung webhook (cho phep nhieu NULL)
SET @idx_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='payments' AND INDEX_NAME='uq_payments_transaction');
SET @sql := IF(@idx_exists=0,
  'ALTER TABLE payments ADD UNIQUE KEY uq_payments_transaction (transaction_id)',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ------------------------------------------------------------
-- 5) VOUCHERS: gia tri don toi thieu de ap dung
-- ------------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangnha' AND TABLE_NAME='vouchers' AND COLUMN_NAME='min_order_amount');
SET @sql := IF(@col_exists=0,
  'ALTER TABLE vouchers ADD COLUMN min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER discount_value',
  'SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ------------------------------------------------------------
-- Du lieu mau wishlist (tuy chon)
-- ------------------------------------------------------------
INSERT IGNORE INTO wishlists (user_id, product_id) VALUES
(2, 1), (2, 4), (2, 9),
(3, 4), (3, 10), (3, 13),
(4, 4), (4, 5);

-- ------------------------------------------------------------
-- USER VOUCHERS (voucher khach da luu) - them neu chua co
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  voucher_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_uv_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_uv_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uq_user_voucher (user_id, voucher_id),
  INDEX idx_uv_user (user_id)
) ENGINE=InnoDB;
