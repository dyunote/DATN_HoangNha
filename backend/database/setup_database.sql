-- ============================================================
-- HOANG NHA - DUNG LAI DATABASE TU DAU (schema + seed)
-- CANH BAO: xoa toan bo du lieu cu trong DB 'hoangnha' roi tao moi.
-- Chay:  mysql -u root -p < setup_database.sql
-- ============================================================
DROP DATABASE IF EXISTS hoangnha;

-- ============================================================
-- HOANG NHA - SCHEMA DATABASE (MySQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS hoangnha
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hoangnha;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  member_level ENUM('normal', 'silver', 'gold', 'vip') NOT NULL DEFAULT 'normal',
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_new TINYINT(1) NOT NULL DEFAULT 0,
  sold_count INT NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_products_category (category_id),
  INDEX idx_products_name (name)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCT IMAGES
-- ------------------------------------------------------------
CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_main TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_images_product (product_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCT VARIANTS (size / color / stock)
-- ------------------------------------------------------------
CREATE TABLE product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size VARCHAR(20) NOT NULL,
  color VARCHAR(50) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_variants_product (product_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CART ITEMS (gop gio hang: moi dong gan thang voi user_id)
-- ------------------------------------------------------------
CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  is_selected TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uq_cart_user_variant (user_id, variant_id),
  INDEX idx_cart_items_user (user_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- VOUCHERS
-- ------------------------------------------------------------
CREATE TABLE vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('percent', 'amount') NOT NULL,
  discount_value DECIMAL(12, 2) NOT NULL,
  min_order_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  voucher_id INT DEFAULT NULL,
  receiver_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  note VARCHAR(500) DEFAULT NULL,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  province VARCHAR(100) DEFAULT NULL,
  shipping_distance_km DECIMAL(8, 2) DEFAULT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'shipping', 'delivered', 'canceled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_orders_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ORDER DETAILS
-- ------------------------------------------------------------
CREATE TABLE order_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_order_details_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_details_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_order_details_order (order_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  method ENUM('cod', 'bank_transfer', 'e_wallet') NOT NULL DEFAULT 'cod',
  transfer_code VARCHAR(50) DEFAULT NULL,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
  transaction_id VARCHAR(50) DEFAULT NULL,
  gateway VARCHAR(100) DEFAULT NULL,
  reference_code VARCHAR(100) DEFAULT NULL,
  paid_at DATETIME DEFAULT NULL,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uq_payments_transaction (transaction_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  image_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_reviews_product (product_id)
) ENGINE=InnoDB;


-- ------------------------------------------------------------
-- WISHLISTS (luot thich san pham)
-- ------------------------------------------------------------
CREATE TABLE wishlists (
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
                                                                                                                                                                                                                                                                                                                                                                         

-- ------------------------------------------------------------
-- USER VOUCHERS (voucher khach da luu vao kho)
-- ------------------------------------------------------------
CREATE TABLE user_vouchers (
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

-- ===================== SEED DATA =====================


USE hoangnha;

-- ------------------------------------------------------------
-- USERS
-- mat khau goc:
--   admin@hoangnha.com  -> admin123
--   khach1..3@gmail.com -> user123
-- ------------------------------------------------------------
INSERT INTO users (full_name, email, password, phone, address, role, member_level, is_locked) VALUES
('Quan tri vien', 'admin@hoangnha.com', '$2a$10$1lBvs9.FIQqsd/0BmVSP0OT43GErz8uPzf..65ISCK2c13N5kAlii', '0900000000', 'Ha Noi, Viet Nam', 'admin', 'vip', 0),
('Nguyen Van An', 'khach1@gmail.com', '$2a$10$.AJYuSS5iuZVZlf2OoYehuBopzIaOc6odLKmy4LyyBlgwederpFri', '0911111111', '12 Nguyen Trai, Quan Thanh Xuan, Ha Noi', 'customer', 'gold', 0),
('Tran Thi Binh', 'khach2@gmail.com', '$2a$10$.AJYuSS5iuZVZlf2OoYehuBopzIaOc6odLKmy4LyyBlgwederpFri', '0922222222', '45 Le Loi, Quan 1, TP.HCM', 'customer', 'silver', 0),
('Le Van Cuong', 'khach3@gmail.com', '$2a$10$.AJYuSS5iuZVZlf2OoYehuBopzIaOc6odLKmy4LyyBlgwederpFri', '0933333333', '78 Tran Phu, TP. Da Nang', 'customer', 'normal', 0);

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
INSERT INTO categories (name, is_hidden) VALUES
('Ao', 0),
('Quan', 0),
('Vay', 0),
('Phu kien', 0);

-- ------------------------------------------------------------
-- PRODUCTS
-- category_id: 1=Ao, 2=Quan, 3=Vay, 4=Phu kien
-- ------------------------------------------------------------
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1,'Ao thun basic trang','Ao thun cotton 100%, form regular, de phoi do, mau trang basic.',159000,1,80,0),
(1,'Ao so mi linen nam','Ao so mi chat lieu linen thoang mat, phong cach lich lam.',329000,0,45,0),
(1,'Ao khoac denim unisex','Ao khoac jean form rong, phong cach ca tinh, ung dung cao.',459000,1,30,0),
(1,'Ao hoodie unisex ni bong','Ao hoodie ni bong day dan, giu am tot, co mu dieu chinh.',379000,0,150,0),
(2,'Quan jeans slimfit nam','Quan jeans co giãn nhe, form slimfit ton dang.',399000,0,120,0),
(2,'Quan kaki ong dung','Quan kaki chat lieu day dan, form ong dung thanh lich.',349000,1,40,0),
(2,'Quan short kaki nam','Quan short kaki nang dong, phu hop mua he.',229000,0,65,0),
(2,'Quan jogger the thao','Quan jogger thun co giãn 4 chieu, ban chun bo.',269000,0,95,0),
(3,'Vay maxi hoa nhi','Vay maxi hoa nhi nu tinh, chat lieu voan mem mai.',459000,1,35,0),
(3,'Vay babydoll tay bong','Vay babydoll dang xoe, tay bong dieu, phong cach Han Quoc.',389000,0,110,0),
(3,'Chan vay chu A xep ly','Chan vay chu A xep ly, chat lieu kaki, de phoi do.',259000,0,50,0),
(4,'That lung da nam','That lung da that cao cap, khoa kim loai chac chan.',199000,1,28,0),
(4,'Tui tote vai canvas','Tui tote vai canvas day dan, in hoa tiet don gian.',149000,0,130,0),
(4,'Mu luoi trai unisex','Mu luoi trai phong cach the thao, deu chinh duoc kich co.',119000,0,75,0),
(4,'Khan len cao cap','Khan len day, giu am tot cho mua dong.',179000,1,22,0);

-- ------------------------------------------------------------
-- PRODUCT IMAGES
-- ------------------------------------------------------------
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(1, 'https://picsum.photos/seed/hn-aothun-1/600/800', 1),
(1, 'https://picsum.photos/seed/hn-aothun-2/600/800', 0),
(2, 'https://picsum.photos/seed/hn-somi-1/600/800', 1),
(2, 'https://picsum.photos/seed/hn-somi-2/600/800', 0),
(3, 'https://picsum.photos/seed/hn-denim-1/600/800', 1),
(3, 'https://picsum.photos/seed/hn-denim-2/600/800', 0),
(4, 'https://picsum.photos/seed/hn-hoodie-1/600/800', 1),
(4, 'https://picsum.photos/seed/hn-hoodie-2/600/800', 0),
(5, 'https://picsum.photos/seed/hn-jeans-1/600/800', 1),
(5, 'https://picsum.photos/seed/hn-jeans-2/600/800', 0),
(6, 'https://picsum.photos/seed/hn-kaki-1/600/800', 1),
(6, 'https://picsum.photos/seed/hn-kaki-2/600/800', 0),
(7, 'https://picsum.photos/seed/hn-short-1/600/800', 1),
(7, 'https://picsum.photos/seed/hn-short-2/600/800', 0),
(8, 'https://picsum.photos/seed/hn-jogger-1/600/800', 1),
(8, 'https://picsum.photos/seed/hn-jogger-2/600/800', 0),
(9, 'https://picsum.photos/seed/hn-vaymaxi-1/600/800', 1),
(9, 'https://picsum.photos/seed/hn-vaymaxi-2/600/800', 0),
(10, 'https://picsum.photos/seed/hn-babydoll-1/600/800', 1),
(10, 'https://picsum.photos/seed/hn-babydoll-2/600/800', 0),
(11, 'https://picsum.photos/seed/hn-chanvay-1/600/800', 1),
(11, 'https://picsum.photos/seed/hn-chanvay-2/600/800', 0),
(12, 'https://picsum.photos/seed/hn-thatlung-1/600/800', 1),
(13, 'https://picsum.photos/seed/hn-tui-1/600/800', 1),
(13, 'https://picsum.photos/seed/hn-tui-2/600/800', 0),
(14, 'https://picsum.photos/seed/hn-mu-1/600/800', 1),
(15, 'https://picsum.photos/seed/hn-khanlen-1/600/800', 1);

-- ------------------------------------------------------------
-- PRODUCT VARIANTS (size / color / stock)
-- ------------------------------------------------------------
INSERT INTO product_variants (product_id, size, color, stock) VALUES
-- 1: Ao thun basic trang
(1, 'S', 'Trang', 20), (1, 'M', 'Trang', 30), (1, 'L', 'Trang', 25), (1, 'M', 'Den', 15),
-- 2: Ao so mi linen nam
(2, 'M', 'Trang', 18), (2, 'L', 'Trang', 12), (2, 'L', 'Xanh nhat', 10),
-- 3: Ao khoac denim unisex
(3, 'M', 'Xanh', 14), (3, 'L', 'Xanh', 16), (3, 'XL', 'Xanh', 8),
-- 4: Ao hoodie unisex ni bong
(4, 'M', 'Den', 25), (4, 'L', 'Den', 30), (4, 'M', 'Xam', 20), (4, 'L', 'Xam', 18),
-- 5: Quan jeans slimfit nam
(5, '29', 'Xanh den', 20), (5, '30', 'Xanh den', 25), (5, '31', 'Xanh den', 18), (5, '32', 'Den', 15),
-- 6: Quan kaki ong dung
(6, '30', 'Be', 15), (6, '31', 'Be', 12), (6, '32', 'Den', 10),
-- 7: Quan short kaki nam
(7, 'M', 'Be', 22), (7, 'L', 'Be', 20), (7, 'L', 'Den', 16),
-- 8: Quan jogger the thao
(8, 'M', 'Den', 30), (8, 'L', 'Den', 28), (8, 'L', 'Xam', 18),
-- 9: Vay maxi hoa nhi
(9, 'S', 'Hoa nhi', 12), (9, 'M', 'Hoa nhi', 15), (9, 'L', 'Hoa nhi', 8),
-- 10: Vay babydoll tay bong
(10, 'S', 'Trang', 16), (10, 'M', 'Trang', 18), (10, 'M', 'Hong', 12),
-- 11: Chan vay chu A xep ly
(11, 'S', 'Den', 14), (11, 'M', 'Den', 16), (11, 'M', 'Xam', 10),
-- 12: That lung da nam
(12, 'Free size', 'Den', 30), (12, 'Free size', 'Nau', 20),
-- 13: Tui tote vai canvas
(13, 'Free size', 'Trang', 40), (13, 'Free size', 'Be', 30),
-- 14: Mu luoi trai unisex
(14, 'Free size', 'Den', 35), (14, 'Free size', 'Trang', 25),
-- 15: Khan len cao cap
(15, 'Free size', 'Xam', 20), (15, 'Free size', 'Nau', 18);

-- ------------------------------------------------------------
-- VOUCHERS
-- ------------------------------------------------------------
INSERT INTO vouchers (code, discount_type, discount_value, start_date, end_date, quantity, is_active) VALUES
('HOANGNHA10', 'percent', 10, '2026-01-01', '2026-12-31', 100, 1),
('GIAM50K', 'amount', 50000, '2026-01-01', '2026-12-31', 50, 1),
('FREESHIP', 'amount', 30000, '2026-01-01', '2026-12-31', 200, 1),
('SALE20', 'percent', 20, '2025-01-01', '2025-12-31', 0, 0);

-- ------------------------------------------------------------
-- CART ITEMS (gio hang gan thang voi user_id)
-- mot vai item dang nam san trong gio cua khach1 (user_id = 2)
-- ------------------------------------------------------------
INSERT INTO cart_items (user_id, variant_id, quantity) VALUES
(2, 2, 1),
(2, 15, 2);

-- ------------------------------------------------------------
-- ORDERS + ORDER_DETAILS + PAYMENTS (du lieu mau cho thong ke)
-- ------------------------------------------------------------
-- Don 1: khach1, da giao, thanh toan COD
-- variant 2 = Ao thun basic trang (159000) x2, variant 11 = Ao hoodie (379000) x1, variant 39 = Tui tote (149000) x1
INSERT INTO orders (user_id, voucher_id, receiver_name, phone, address, note, total_amount, status, created_at) VALUES
(2, NULL, 'Nguyen Van An', '0911111111', '12 Nguyen Trai, Quan Thanh Xuan, Ha Noi', 'Giao gio hanh chinh', 846000, 'delivered', '2026-05-02 09:30:00');
INSERT INTO order_details (order_id, variant_id, quantity, price) VALUES
(1, 2, 2, 159000),
(1, 11, 1, 379000),
(1, 39, 1, 149000);
INSERT INTO payments (order_id, method, status, paid_at) VALUES
(1, 'cod', 'paid', '2026-05-03 14:00:00');

-- Don 2: khach2, dang giao, chuyen khoan, ap voucher HOANGNHA10 (-10%)
-- variant 16 = Quan jeans (399000) x1, variant 23 = Quan short kaki (229000) x2
INSERT INTO orders (user_id, voucher_id, receiver_name, phone, address, note, total_amount, status, created_at) VALUES
(3, 1, 'Tran Thi Binh', '0922222222', '45 Le Loi, Quan 1, TP.HCM', NULL, 771300, 'shipping', '2026-05-20 15:10:00');
INSERT INTO order_details (order_id, variant_id, quantity, price) VALUES
(2, 16, 1, 399000),
(2, 23, 2, 229000);
INSERT INTO payments (order_id, method, status, paid_at) VALUES
(2, 'bank_transfer', 'paid', '2026-05-20 15:30:00');

-- Don 3: khach3, dang cho xu ly, COD
-- variant 27 = Quan jogger (269000) x1, variant 35 = Chan vay chu A (259000) x1
INSERT INTO orders (user_id, voucher_id, receiver_name, phone, address, note, total_amount, status, created_at) VALUES
(4, NULL, 'Le Van Cuong', '0933333333', '78 Tran Phu, TP. Da Nang', 'Goi truoc khi giao', 528000, 'pending', '2026-06-05 10:00:00');
INSERT INTO order_details (order_id, variant_id, quantity, price) VALUES
(3, 27, 1, 269000),
(3, 35, 1, 259000);
INSERT INTO payments (order_id, method, status, paid_at) VALUES
(3, 'cod', 'unpaid', NULL);

-- Don 4: khach1, da huy
-- variant 31 = Vay babydoll (389000) x1
INSERT INTO orders (user_id, voucher_id, receiver_name, phone, address, note, total_amount, status, created_at) VALUES
(2, NULL, 'Nguyen Van An', '0911111111', '12 Nguyen Trai, Quan Thanh Xuan, Ha Noi', NULL, 389000, 'canceled', '2026-04-15 08:00:00');
INSERT INTO order_details (order_id, variant_id, quantity, price) VALUES
(4, 31, 1, 389000);
INSERT INTO payments (order_id, method, status, paid_at) VALUES
(4, 'e_wallet', 'unpaid', NULL);

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
INSERT INTO reviews (user_id, product_id, rating, comment, image_url, created_at) VALUES
(2, 1, 5, 'Ao chat lieu mat, mac thoai mai, dang chuan.', NULL, '2026-05-10 10:00:00'),
(3, 5, 4, 'Quan dep nhung hoi rong o eo, nen chon size nho hon.', NULL, '2026-05-22 12:00:00'),
(4, 8, 5, 'Quan jogger mac tap gym rat thoai mai, sẽ ung ho them.', NULL, '2026-06-06 09:00:00'),
(2, 4, 5, 'Hoodie ni day, giu am tot, dang muon mua them mau khac.', NULL, '2026-05-12 16:00:00'),
(3, 9, 4, 'Vay dep, hoa van xinh, chat voan hoi mong.', NULL, '2026-05-25 11:00:00');
                               