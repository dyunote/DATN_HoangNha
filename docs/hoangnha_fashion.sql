-- ============================================================
-- Hoàng Nha Fashion — Cơ sở dữ liệu `hoangnha_fashion` (14 bảng)
-- MySQL / MariaDB (XAMPP) · utf8mb4 · InnoDB
-- Sinh từ backend/prisma/schema.prisma (đã sửa theo góp ý ERD):
--   1. Tên bảng SỐ NHIỀU + snake_case (users, orders, vouchers...)
--   2. cart_items / order_items / reviews chỉ nối vào variants
--   3. payments GỘP vào orders (quan hệ 1-1)
--   4. sepay_webhook_logs đã XÓA
-- Import: phpMyAdmin > Import, hoặc:
--   mysql -u root < hoangnha_fashion.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- Cách 1 (mặc định): xóa sạch cả database rồi tạo lại.
DROP DATABASE IF EXISTS `hoangnha_fashion`;
CREATE DATABASE `hoangnha_fashion` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hoangnha_fashion`;

-- ------------------------------------------------------------
-- Cách 2 (dự phòng): nếu tài khoản MySQL không có quyền DROP DATABASE,
-- hãy xóa 3 dòng ở trên, tự tạo database rồi chọn nó, và để khối
-- DROP TABLE dưới đây dọn bảng cũ. Khối này chạy được cả khi database
-- đang trống (IF EXISTS) nên để nguyên cũng không sao.
--
-- Xóa cả TÊN CŨ (PascalCase, bản 15 bảng) lẫn TÊN MỚI (snake_case),
-- vì `User` và `users` là hai bảng khác nhau — nhập bản mới đè lên bản
-- cũ mà không xóa thì database sẽ tồn tại song song 28 bảng lẫn lộn.
-- FOREIGN_KEY_CHECKS = 0 ở trên nên thứ tự xóa không quan trọng.
-- ------------------------------------------------------------

-- Bảng cũ (bản 15 bảng — gồm cả Payment và SepayWebhookLog đã bỏ)
DROP TABLE IF EXISTS `SepayWebhookLog`;
DROP TABLE IF EXISTS `Payment`;
DROP TABLE IF EXISTS `OrderItem`;
DROP TABLE IF EXISTS `Order`;
DROP TABLE IF EXISTS `Notification`;
DROP TABLE IF EXISTS `Review`;
DROP TABLE IF EXISTS `CartItem`;
DROP TABLE IF EXISTS `Variant`;
DROP TABLE IF EXISTS `ProductImage`;
DROP TABLE IF EXISTS `Product`;
DROP TABLE IF EXISTS `Category`;
DROP TABLE IF EXISTS `Address`;
DROP TABLE IF EXISTS `Voucher`;
DROP TABLE IF EXISTS `Banner`;
DROP TABLE IF EXISTS `User`;

-- Bảng mới (14 bảng) — xóa để nhập lại từ đầu
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `variants`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `addresses`;
DROP TABLE IF EXISTS `vouchers`;
DROP TABLE IF EXISTS `banners`;
DROP TABLE IF EXISTS `users`;

-- ============ 1. users — NGƯỜI DÙNG ============
CREATE TABLE `users` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(191)  NOT NULL,
  `email`         VARCHAR(191)  NOT NULL,
  `password_hash` VARCHAR(191)  NOT NULL,
  `phone`         VARCHAR(191)  NULL,
  `avatar`        VARCHAR(191)  NULL,
  `gender`        VARCHAR(191)  NULL,
  `birthday`      VARCHAR(191)  NULL,
  `role`          VARCHAR(191)  NOT NULL DEFAULT 'CUSTOMER',
  `created_at`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 2. addresses — SỔ ĐỊA CHỈ ============
CREATE TABLE `addresses` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  `label`      VARCHAR(191) NOT NULL,
  `name`       VARCHAR(191) NOT NULL,
  `phone`      VARCHAR(191) NOT NULL,
  `street`     VARCHAR(191) NOT NULL,
  `ward`       VARCHAR(191) NOT NULL,
  `district`   VARCHAR(191) NOT NULL,
  `city`       VARCHAR(191) NOT NULL,
  `is_default` TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `addresses_user_id_idx` (`user_id`),
  CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 3. categories — DANH MỤC ============
CREATE TABLE `categories` (
  `id`    INT          NOT NULL AUTO_INCREMENT,
  `name`  VARCHAR(191) NOT NULL,
  `slug`  VARCHAR(191) NOT NULL,
  `image` TEXT         NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 4. products — SẢN PHẨM ============
CREATE TABLE `products` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `category_id`    INT          NOT NULL,
  `name`           VARCHAR(191) NOT NULL,
  `slug`           VARCHAR(191) NOT NULL,
  `description`    TEXT         NOT NULL,
  `price`          INT          NOT NULL,
  `old_price`      INT          NULL,
  `brand`          VARCHAR(191) NOT NULL,
  `material`       VARCHAR(191) NOT NULL,
  `rating`         DOUBLE       NOT NULL DEFAULT 0,
  `review_count`   INT          NOT NULL DEFAULT 0,
  `sold`           INT          NOT NULL DEFAULT 0,
  `is_new`         TINYINT(1)   NOT NULL DEFAULT 0,
  `is_best_seller` TINYINT(1)   NOT NULL DEFAULT 0,
  `is_trending`    TINYINT(1)   NOT NULL DEFAULT 0,
  `flash_sale`     TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_key` (`slug`),
  KEY `products_category_id_idx` (`category_id`),
  CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 5. product_images — ẢNH SẢN PHẨM ============
CREATE TABLE `product_images` (
  `id`         INT  NOT NULL AUTO_INCREMENT,
  `product_id` INT  NOT NULL,
  `url`        TEXT NOT NULL,
  `sort_order` INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `product_images_product_id_idx` (`product_id`),
  CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 6. variants — BIẾN THỂ (màu × size × tồn kho) ============
-- "Đơn vị bán" duy nhất: cart_items / order_items / reviews chỉ nối vào đây.
CREATE TABLE `variants` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `product_id` INT          NOT NULL,
  `color`      VARCHAR(191) NOT NULL,
  `color_hex`  VARCHAR(191) NOT NULL,
  `size`       VARCHAR(191) NOT NULL,
  `stock`      INT          NOT NULL DEFAULT 0,
  `price`      INT          NULL,     -- NULL = dùng giá sản phẩm
  `old_price`  INT          NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `variants_product_id_color_size_key` (`product_id`, `color`, `size`),
  CONSTRAINT `variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 7. cart_items — GIỎ HÀNG ============
CREATE TABLE `cart_items` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `user_id`    INT NOT NULL,
  `variant_id` INT NOT NULL,
  `quantity`   INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cart_items_user_id_variant_id_key` (`user_id`, `variant_id`),
  KEY `cart_items_variant_id_idx` (`variant_id`),
  CONSTRAINT `cart_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 8. vouchers (tạo trước orders vì orders tham chiếu tới) ============
CREATE TABLE `vouchers` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(191) NOT NULL,
  `type`        VARCHAR(191) NOT NULL,  -- percent | fixed | freeship
  `value`       INT          NOT NULL,
  `description` VARCHAR(191) NOT NULL,
  `min_order`   INT          NOT NULL DEFAULT 0,
  `expiry`      DATETIME(3)  NOT NULL,
  `usage_limit` INT          NOT NULL DEFAULT 1000,
  `used_count`  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vouchers_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 9. orders — ĐƠN HÀNG (gộp vận đơn + THANH TOÁN) ============
-- payments cũ gộp vào đây (quan hệ 1-1): payment_status, pay_code,
-- pay_expires_at, paid_at, transaction_code.
CREATE TABLE `orders` (
  `id`               VARCHAR(191) NOT NULL,          -- HN-yymmdd-xxxx
  `user_id`          INT          NOT NULL,
  `voucher_id`       INT          NULL,
  `status`           VARCHAR(191) NOT NULL DEFAULT 'pending',
  `shipping_method`  VARCHAR(191) NOT NULL DEFAULT 'standard',
  `shipping_fee`     INT          NOT NULL DEFAULT 0,
  `discount`         INT          NOT NULL DEFAULT 0,
  `subtotal`         INT          NOT NULL,
  `total`            INT          NOT NULL,
  `receiver_name`    VARCHAR(191) NOT NULL,
  `receiver_phone`   VARCHAR(191) NOT NULL,
  `receiver_email`   VARCHAR(191) NOT NULL,
  `address_text`     TEXT         NOT NULL,
  `note`             TEXT         NULL,
  `payment_method`   VARCHAR(191) NOT NULL,           -- cod | qr
  `payment_status`   VARCHAR(191) NOT NULL DEFAULT 'pending', -- pending|paid|failed|refunded
  `pay_code`         VARCHAR(191) NULL,               -- mã trong nội dung CK (SePay)
  `pay_expires_at`   DATETIME(3)  NULL,               -- hạn QR (15 phút)
  `paid_at`          DATETIME(3)  NULL,
  `transaction_code` VARCHAR(191) NULL,
  `ship_carrier`     VARCHAR(191) NULL,
  `tracking_code`    VARCHAR(191) NULL,
  `shipped_at`       DATETIME(3)  NULL,
  `delivered_at`     DATETIME(3)  NULL,
  `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_pay_code_key` (`pay_code`),
  KEY `orders_user_id_idx` (`user_id`),
  KEY `orders_voucher_id_idx` (`voucher_id`),
  CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `orders_voucher_id_fkey` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 10. order_items — DÒNG ĐƠN HÀNG (snapshot giá) ============
CREATE TABLE `order_items` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `order_id`   VARCHAR(191) NOT NULL,
  `variant_id` INT          NOT NULL,
  `name`       VARCHAR(191) NOT NULL,  -- snapshot tên lúc mua
  `price`      INT          NOT NULL,  -- snapshot giá lúc mua
  `quantity`   INT          NOT NULL,
  `color`      VARCHAR(191) NOT NULL,  -- snapshot (admin có thể sửa variant sau)
  `size`       VARCHAR(191) NOT NULL,
  `image`      TEXT         NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `order_items_variant_id_idx` (`variant_id`),
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 11. reviews — ĐÁNH GIÁ (chỉ nối vào variants) ============
CREATE TABLE `reviews` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `user_id`     INT          NOT NULL,
  `variant_id`  INT          NOT NULL,
  `rating`      INT          NOT NULL,
  `title`       VARCHAR(191) NULL,
  `content`     TEXT         NOT NULL,
  `admin_reply` TEXT         NULL,
  `approved`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `reviews_user_id_idx` (`user_id`),
  KEY `reviews_variant_id_idx` (`variant_id`),
  CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reviews_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 12. notifications — THÔNG BÁO ============
CREATE TABLE `notifications` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  `order_id`   VARCHAR(191) NULL,   -- type=order → mở đúng đơn
  `voucher_id` INT          NULL,   -- type=promo → áp mã luôn
  `title`      VARCHAR(191) NOT NULL,
  `content`    TEXT         NOT NULL,
  `type`       VARCHAR(191) NOT NULL DEFAULT 'system',
  `read`       TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_idx` (`user_id`),
  KEY `notifications_order_id_idx` (`order_id`),
  KEY `notifications_voucher_id_idx` (`voucher_id`),
  CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifications_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifications_voucher_id_fkey` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 13. password_resets — OTP QUÊN MẬT KHẨU ============
-- Chỉ lưu BẢN BĂM bcrypt của OTP (lộ DB không đọc được mã),
-- hết hạn 5 phút, sai quá 5 lần (attempts) thì mã bị vô hiệu.
CREATE TABLE `password_resets` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  `otp_hash`   VARCHAR(191) NOT NULL,
  `expires_at` DATETIME(3)  NOT NULL,
  `used_at`    DATETIME(3)  NULL,    -- NULL = chưa dùng
  `attempts`   INT          NOT NULL DEFAULT 0,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `password_resets_user_id_fkey` (`user_id`),
  CONSTRAINT `password_resets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ 14. banners — BANNER (hero trang chủ) ============
CREATE TABLE `banners` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `eyebrow`    VARCHAR(191) NOT NULL,
  `title`      VARCHAR(191) NOT NULL,
  `subtitle`   TEXT         NOT NULL,
  `image`      TEXT         NOT NULL,
  `cta`        VARCHAR(191) NOT NULL DEFAULT 'Khám phá ngay',
  `active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `sort_order` INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DỮ LIỆU MẪU (khớp backend/prisma/seed.ts)
-- Tài khoản: admin@hoangnha.vn / admin1234 · duytran.220218@gmail.com / 12345678
-- ============================================================

-- 1. users
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `avatar`, `gender`, `birthday`, `role`, `created_at`) VALUES
  (1, 'Quản trị viên', 'admin@hoangnha.vn', '$2b$10$LfFM0HrxFyK2H.ri3d96veZwJahnESnhWOISM6R9vZt3ec77vcFmG', NULL, 'https://i.pravatar.cc/160?img=13', NULL, NULL, 'ADMIN', '2026-07-25 10:00:00.000'),
  (2, 'Trần Duy', 'duytran.220218@gmail.com', '$2b$10$txEySu6c0kJUxonJT3mpUewYkGYbr4uDX/8IGhdqJHyLDbgFd8nFy', '0901234567', 'https://i.pravatar.cc/160?img=13', 'Nam', '2002-02-18', 'CUSTOMER', '2026-07-25 10:00:00.000');

-- 2. addresses
INSERT INTO `addresses` (`id`, `user_id`, `label`, `name`, `phone`, `street`, `ward`, `district`, `city`, `is_default`) VALUES
  (1, 2, 'Nhà riêng', 'Trần Duy', '0901 234 567', '86 Nguyễn Huệ', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh', 1),
  (2, 2, 'Văn phòng', 'Trần Duy', '0938 765 432', 'Tầng 12, Landmark 81, 720A Điện Biên Phủ', 'Phường 22', 'Quận Bình Thạnh', 'TP. Hồ Chí Minh', 0);

-- 3. categories
INSERT INTO `categories` (`id`, `name`, `slug`, `image`) VALUES
  (1, 'Áo khoác', 'ao-khoac', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=80'),
  (2, 'Đầm & Váy', 'dam-vay', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80'),
  (3, 'Sơ mi', 'so-mi', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80'),
  (4, 'Quần', 'quan', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80'),
  (5, 'Áo thun', 'ao-thun', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),
  (6, 'Phụ kiện', 'phu-kien', 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=900&q=80');

-- 4. products (24 sản phẩm)
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `old_price`, `brand`, `material`, `rating`, `review_count`, `sold`, `is_new`, `is_best_seller`, `is_trending`, `flash_sale`, `created_at`) VALUES
  (1, 1, 'Áo khoác dạ Oversized Wool', 'san-pham-1', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 540000, 720000, 'Hoàng Nha', 'Cotton hữu cơ', 4, 12, 40, 1, 0, 0, 1, '2026-07-25 10:00:00.000'),
  (2, 2, 'Đầm lụa Midi Thanh Lịch', 'san-pham-2', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 890000, NULL, 'HN Studio', 'Lụa tơ tằm', 4.7, 49, 93, 1, 1, 0, 0, '2026-07-25 10:00:00.000'),
  (3, 3, 'Sơ mi Linen Premium Trắng', 'san-pham-3', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 450000, NULL, 'Atelier HN', 'Linen Pháp', 4.4, 86, 146, 1, 0, 1, 0, '2026-07-25 10:00:00.000'),
  (4, 1, 'Blazer Cấu Trúc Hiện Đại', 'san-pham-4', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 862500, 1150000, 'HN Essentials', 'Wool Ý', 4.1, 123, 199, 1, 0, 0, 1, '2026-07-25 10:00:00.000'),
  (5, 4, 'Quần Âu Ống Suông Wide-leg', 'san-pham-5', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 520000, NULL, 'Hoàng Nha', 'Cashmere', 4.8, 160, 252, 1, 0, 0, 0, '2026-07-25 10:00:00.000'),
  (6, 5, 'Áo thun Cotton Supima Basic', 'san-pham-6', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 220000, NULL, 'HN Studio', 'Denim Nhật', 4.5, 197, 305, 1, 1, 1, 0, '2026-07-25 10:00:00.000'),
  (7, 2, 'Đầm Slip Satin Đêm Tiệc', 'san-pham-7', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 585000, 780000, 'Atelier HN', 'Cotton hữu cơ', 4.2, 14, 358, 1, 0, 0, 1, '2026-07-25 10:00:00.000'),
  (8, 1, 'Cardigan Cashmere Mềm Mại', 'san-pham-8', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 960000, NULL, 'HN Essentials', 'Lụa tơ tằm', 4.9, 51, 411, 1, 0, 0, 0, '2026-07-25 10:00:00.000'),
  (9, 2, 'Chân váy Midi Xếp Ly', 'san-pham-9', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 430000, NULL, 'Hoàng Nha', 'Linen Pháp', 4.6, 88, 464, 0, 0, 1, 0, '2026-07-25 10:00:00.000'),
  (10, 1, 'Trench Coat Cổ Điển Beige', 'san-pham-10', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 1012500, 1350000, 'HN Studio', 'Wool Ý', 4.3, 125, 517, 0, 1, 0, 1, '2026-07-25 10:00:00.000'),
  (11, 3, 'Sơ mi Oxford Regular Fit', 'san-pham-11', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 380000, NULL, 'Atelier HN', 'Cashmere', 4, 162, 570, 0, 0, 0, 0, '2026-07-25 10:00:00.000'),
  (12, 4, 'Quần Jeans Straight Vintage', 'san-pham-12', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 490000, NULL, 'HN Essentials', 'Denim Nhật', 4.7, 199, 623, 0, 0, 1, 0, '2026-07-25 10:00:00.000'),
  (13, 5, 'Áo len Merino Cổ Lọ', 'san-pham-13', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 405000, 540000, 'Hoàng Nha', 'Cotton hữu cơ', 4.4, 16, 676, 0, 0, 0, 1, '2026-07-25 10:00:00.000'),
  (14, 2, 'Đầm Wrap Hoa Nhí Mùa Hè', 'san-pham-14', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 610000, NULL, 'HN Studio', 'Lụa tơ tằm', 4.1, 53, 729, 0, 1, 0, 0, '2026-07-25 10:00:00.000'),
  (15, 6, 'Túi Tote Da Minimal', 'san-pham-15', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 850000, NULL, 'Atelier HN', 'Linen Pháp', 4.8, 90, 782, 0, 0, 1, 0, '2026-07-25 10:00:00.000'),
  (16, 6, 'Khăn lụa Twill Họa Tiết', 'san-pham-16', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 240000, 320000, 'HN Essentials', 'Wool Ý', 4.5, 127, 835, 0, 0, 0, 0, '2026-07-25 10:00:00.000'),
  (17, 5, 'Áo Polo Piqué Luxury', 'san-pham-17', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 340000, NULL, 'Hoàng Nha', 'Cashmere', 4.2, 164, 888, 0, 0, 0, 0, '2026-07-25 10:00:00.000'),
  (18, 4, 'Quần Short Linen Nghỉ Dưỡng', 'san-pham-18', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 290000, NULL, 'HN Studio', 'Denim Nhật', 4.9, 201, 41, 0, 1, 1, 0, '2026-07-25 10:00:00.000'),
  (19, 1, 'Vest Không Tay Smart Casual', 'san-pham-19', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 510000, 680000, 'Atelier HN', 'Cotton hữu cơ', 4.6, 18, 94, 0, 0, 0, 0, '2026-07-25 10:00:00.000'),
  (20, 3, 'Sơ mi Lụa Tay Bồng', 'san-pham-20', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 560000, NULL, 'HN Essentials', 'Lụa tơ tằm', 4.3, 55, 147, 0, 0, 0, 0, '2026-07-25 10:00:00.000'),
  (21, 2, 'Đầm Maxi Cổ Yếm Sang Trọng', 'san-pham-21', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 920000, NULL, 'Hoàng Nha', 'Linen Pháp', 4, 92, 200, 0, 0, 1, 0, '2026-07-25 10:00:00.000'),
  (22, 4, 'Quần Culottes Thanh Lịch', 'san-pham-22', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 352500, 470000, 'HN Studio', 'Wool Ý', 4.7, 129, 253, 0, 1, 0, 0, '2026-07-25 10:00:00.000'),
  (23, 5, 'Áo Hoodie Cotton Nặng Premium', 'san-pham-23', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 420000, NULL, 'Atelier HN', 'Cashmere', 4.4, 166, 306, 0, 0, 0, 0, '2026-07-25 10:00:00.000'),
  (24, 6, 'Belt Da Ý Khóa Kim Loại', 'san-pham-24', 'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.', 380000, NULL, 'HN Essentials', 'Denim Nhật', 4.1, 203, 359, 0, 0, 1, 0, '2026-07-25 10:00:00.000');

-- 5. product_images (4 ảnh / sản phẩm)
INSERT INTO `product_images` (`id`, `product_id`, `url`, `sort_order`) VALUES
  (1, 1, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 0),
  (2, 1, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', 1),
  (3, 1, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80', 2),
  (4, 1, 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80', 3),
  (5, 2, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 0),
  (6, 2, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80', 1),
  (7, 2, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', 2),
  (8, 2, 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80', 3),
  (9, 3, 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80', 0),
  (10, 3, 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80', 1),
  (11, 3, 'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=900&q=80', 2),
  (12, 3, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80', 3),
  (13, 4, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80', 0),
  (14, 4, 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80', 1),
  (15, 4, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80', 2),
  (16, 4, 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80', 3),
  (17, 5, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 0),
  (18, 5, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80', 1),
  (19, 5, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80', 2),
  (20, 5, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 3),
  (21, 6, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', 0),
  (22, 6, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80', 1),
  (23, 6, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80', 2),
  (24, 6, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80', 3),
  (25, 7, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80', 0),
  (26, 7, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80', 1),
  (27, 7, 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80', 2),
  (28, 7, 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80', 3),
  (29, 8, 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80', 0),
  (30, 8, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', 1),
  (31, 8, 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80', 2),
  (32, 8, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 3),
  (33, 9, 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80', 0),
  (34, 9, 'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=900&q=80', 1),
  (35, 9, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80', 2),
  (36, 9, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 3),
  (37, 10, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80', 0),
  (38, 10, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80', 1),
  (39, 10, 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80', 2),
  (40, 10, 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80', 3),
  (41, 11, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80', 0),
  (42, 11, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80', 1),
  (43, 11, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 2),
  (44, 11, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80', 3),
  (45, 12, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80', 0),
  (46, 12, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80', 1),
  (47, 12, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80', 2),
  (48, 12, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 3),
  (49, 13, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', 0),
  (50, 13, 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80', 1),
  (51, 13, 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80', 2),
  (52, 13, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', 3),
  (53, 14, 'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=900&q=80', 0),
  (54, 14, 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80', 1),
  (55, 14, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 2),
  (56, 14, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80', 3),
  (57, 15, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80', 0),
  (58, 15, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80', 1),
  (59, 15, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 2),
  (60, 15, 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80', 3),
  (61, 16, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80', 0),
  (62, 16, 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80', 1),
  (63, 16, 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80', 2),
  (64, 16, 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80', 3),
  (65, 17, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80', 0),
  (66, 17, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 1),
  (67, 17, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80', 2),
  (68, 17, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80', 3),
  (69, 18, 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80', 0),
  (70, 18, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80', 1),
  (71, 18, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 2),
  (72, 18, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80', 3),
  (73, 19, 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80', 0),
  (74, 19, 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80', 1),
  (75, 19, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', 2),
  (76, 19, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80', 3),
  (77, 20, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80', 0),
  (78, 20, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 1),
  (79, 20, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80', 2),
  (80, 20, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', 3),
  (81, 21, 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80', 0),
  (82, 21, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 1),
  (83, 21, 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80', 2),
  (84, 21, 'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=900&q=80', 3),
  (85, 22, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 0),
  (86, 22, 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80', 1),
  (87, 22, 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80', 2),
  (88, 22, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80', 3),
  (89, 23, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80', 0),
  (90, 23, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80', 1),
  (91, 23, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80', 2),
  (92, 23, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80', 3),
  (93, 24, 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80', 0),
  (94, 24, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 1),
  (95, 24, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80', 2),
  (96, 24, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80', 3);

-- 6. variants (màu × size, kèm giá riêng cho 1/4 số sản phẩm)
INSERT INTO `variants` (`id`, `product_id`, `color`, `color_hex`, `size`, `stock`, `price`, `old_price`) VALUES
  (1, 1, 'Đen', '#111111', 'XS', 5, 570000, 720000),
  (2, 1, 'Đen', '#111111', 'S', 4, 570000, 720000),
  (3, 1, 'Đen', '#111111', 'M', 4, 570000, 720000),
  (4, 1, 'Đen', '#111111', 'L', 4, 590000, 740000),
  (5, 1, 'Đen', '#111111', 'XL', 5, 620000, 770000),
  (6, 1, 'Kem', '#EDE6D6', 'XS', 5, 540000, 720000),
  (7, 1, 'Kem', '#EDE6D6', 'S', 4, 540000, 720000),
  (8, 1, 'Kem', '#EDE6D6', 'M', 4, 540000, 720000),
  (9, 1, 'Kem', '#EDE6D6', 'L', 4, 560000, 740000),
  (10, 1, 'Kem', '#EDE6D6', 'XL', 5, 590000, 770000),
  (11, 1, 'Be', '#D6B98C', 'XS', 5, 540000, 720000),
  (12, 1, 'Be', '#D6B98C', 'S', 4, 540000, 720000),
  (13, 1, 'Be', '#D6B98C', 'M', 4, 540000, 720000),
  (14, 1, 'Be', '#D6B98C', 'L', 4, 560000, 740000),
  (15, 1, 'Be', '#D6B98C', 'XL', 5, 590000, 770000),
  (16, 2, 'Trắng', '#FFFFFF', 'XS', 18, NULL, NULL),
  (17, 2, 'Trắng', '#FFFFFF', 'S', 17, NULL, NULL),
  (18, 2, 'Trắng', '#FFFFFF', 'M', 17, NULL, NULL),
  (19, 2, 'Trắng', '#FFFFFF', 'L', 17, NULL, NULL),
  (20, 2, 'Trắng', '#FFFFFF', 'XL', 18, NULL, NULL),
  (21, 2, 'Xám', '#94A3B8', 'XS', 18, NULL, NULL),
  (22, 2, 'Xám', '#94A3B8', 'S', 17, NULL, NULL),
  (23, 2, 'Xám', '#94A3B8', 'M', 17, NULL, NULL),
  (24, 2, 'Xám', '#94A3B8', 'L', 17, NULL, NULL),
  (25, 2, 'Xám', '#94A3B8', 'XL', 18, NULL, NULL),
  (26, 2, 'Navy', '#1E293B', 'XS', 18, NULL, NULL),
  (27, 2, 'Navy', '#1E293B', 'S', 17, NULL, NULL),
  (28, 2, 'Navy', '#1E293B', 'M', 17, NULL, NULL),
  (29, 2, 'Navy', '#1E293B', 'L', 17, NULL, NULL),
  (30, 2, 'Navy', '#1E293B', 'XL', 18, NULL, NULL),
  (31, 3, 'Nâu', '#8B6F47', 'XS', 11, NULL, NULL),
  (32, 3, 'Nâu', '#8B6F47', 'S', 10, NULL, NULL),
  (33, 3, 'Nâu', '#8B6F47', 'M', 10, NULL, NULL),
  (34, 3, 'Nâu', '#8B6F47', 'L', 10, NULL, NULL),
  (35, 3, 'Nâu', '#8B6F47', 'XL', 11, NULL, NULL),
  (36, 3, 'Đen', '#111111', 'XS', 11, NULL, NULL),
  (37, 3, 'Đen', '#111111', 'S', 10, NULL, NULL),
  (38, 3, 'Đen', '#111111', 'M', 10, NULL, NULL),
  (39, 3, 'Đen', '#111111', 'L', 10, NULL, NULL),
  (40, 3, 'Đen', '#111111', 'XL', 11, NULL, NULL),
  (41, 3, 'Olive', '#6B7250', 'XS', 11, NULL, NULL),
  (42, 3, 'Olive', '#6B7250', 'S', 10, NULL, NULL),
  (43, 3, 'Olive', '#6B7250', 'M', 10, NULL, NULL),
  (44, 3, 'Olive', '#6B7250', 'L', 10, NULL, NULL),
  (45, 3, 'Olive', '#6B7250', 'XL', 11, NULL, NULL),
  (46, 4, 'Đen', '#111111', 'XS', 4, NULL, NULL),
  (47, 4, 'Đen', '#111111', 'S', 3, NULL, NULL),
  (48, 4, 'Đen', '#111111', 'M', 3, NULL, NULL),
  (49, 4, 'Đen', '#111111', 'L', 3, NULL, NULL),
  (50, 4, 'Đen', '#111111', 'XL', 4, NULL, NULL),
  (51, 4, 'Kem', '#EDE6D6', 'XS', 4, NULL, NULL),
  (52, 4, 'Kem', '#EDE6D6', 'S', 3, NULL, NULL),
  (53, 4, 'Kem', '#EDE6D6', 'M', 3, NULL, NULL),
  (54, 4, 'Kem', '#EDE6D6', 'L', 3, NULL, NULL),
  (55, 4, 'Kem', '#EDE6D6', 'XL', 4, NULL, NULL),
  (56, 4, 'Be', '#D6B98C', 'XS', 4, NULL, NULL),
  (57, 4, 'Be', '#D6B98C', 'S', 3, NULL, NULL),
  (58, 4, 'Be', '#D6B98C', 'M', 3, NULL, NULL),
  (59, 4, 'Be', '#D6B98C', 'L', 3, NULL, NULL),
  (60, 4, 'Be', '#D6B98C', 'XL', 4, NULL, NULL),
  (61, 5, 'Trắng', '#FFFFFF', 'XS', 17, 550000, NULL),
  (62, 5, 'Trắng', '#FFFFFF', 'S', 16, 550000, NULL),
  (63, 5, 'Trắng', '#FFFFFF', 'M', 16, 550000, NULL),
  (64, 5, 'Trắng', '#FFFFFF', 'L', 16, 570000, NULL),
  (65, 5, 'Trắng', '#FFFFFF', 'XL', 17, 600000, NULL),
  (66, 5, 'Xám', '#94A3B8', 'XS', 17, 520000, NULL),
  (67, 5, 'Xám', '#94A3B8', 'S', 16, 520000, NULL),
  (68, 5, 'Xám', '#94A3B8', 'M', 16, 520000, NULL),
  (69, 5, 'Xám', '#94A3B8', 'L', 16, 540000, NULL),
  (70, 5, 'Xám', '#94A3B8', 'XL', 17, 570000, NULL),
  (71, 5, 'Navy', '#1E293B', 'XS', 17, 520000, NULL),
  (72, 5, 'Navy', '#1E293B', 'S', 16, 520000, NULL),
  (73, 5, 'Navy', '#1E293B', 'M', 16, 520000, NULL),
  (74, 5, 'Navy', '#1E293B', 'L', 16, 540000, NULL),
  (75, 5, 'Navy', '#1E293B', 'XL', 17, 570000, NULL),
  (76, 6, 'Nâu', '#8B6F47', 'XS', 10, NULL, NULL),
  (77, 6, 'Nâu', '#8B6F47', 'S', 9, NULL, NULL),
  (78, 6, 'Nâu', '#8B6F47', 'M', 9, NULL, NULL),
  (79, 6, 'Nâu', '#8B6F47', 'L', 9, NULL, NULL),
  (80, 6, 'Nâu', '#8B6F47', 'XL', 10, NULL, NULL),
  (81, 6, 'Đen', '#111111', 'XS', 10, NULL, NULL),
  (82, 6, 'Đen', '#111111', 'S', 9, NULL, NULL),
  (83, 6, 'Đen', '#111111', 'M', 9, NULL, NULL),
  (84, 6, 'Đen', '#111111', 'L', 9, NULL, NULL),
  (85, 6, 'Đen', '#111111', 'XL', 10, NULL, NULL),
  (86, 6, 'Olive', '#6B7250', 'XS', 10, NULL, NULL),
  (87, 6, 'Olive', '#6B7250', 'S', 9, NULL, NULL),
  (88, 6, 'Olive', '#6B7250', 'M', 9, NULL, NULL),
  (89, 6, 'Olive', '#6B7250', 'L', 9, NULL, NULL),
  (90, 6, 'Olive', '#6B7250', 'XL', 10, NULL, NULL),
  (91, 7, 'Đen', '#111111', 'XS', 3, NULL, NULL),
  (92, 7, 'Đen', '#111111', 'S', 22, NULL, NULL),
  (93, 7, 'Đen', '#111111', 'M', 22, NULL, NULL),
  (94, 7, 'Đen', '#111111', 'L', 22, NULL, NULL),
  (95, 7, 'Đen', '#111111', 'XL', 3, NULL, NULL),
  (96, 7, 'Kem', '#EDE6D6', 'XS', 3, NULL, NULL),
  (97, 7, 'Kem', '#EDE6D6', 'S', 22, NULL, NULL),
  (98, 7, 'Kem', '#EDE6D6', 'M', 22, NULL, NULL),
  (99, 7, 'Kem', '#EDE6D6', 'L', 22, NULL, NULL),
  (100, 7, 'Kem', '#EDE6D6', 'XL', 3, NULL, NULL),
  (101, 7, 'Be', '#D6B98C', 'XS', 3, NULL, NULL),
  (102, 7, 'Be', '#D6B98C', 'S', 22, NULL, NULL),
  (103, 7, 'Be', '#D6B98C', 'M', 22, NULL, NULL),
  (104, 7, 'Be', '#D6B98C', 'L', 22, NULL, NULL),
  (105, 7, 'Be', '#D6B98C', 'XL', 3, NULL, NULL),
  (106, 8, 'Trắng', '#FFFFFF', 'XS', 16, NULL, NULL),
  (107, 8, 'Trắng', '#FFFFFF', 'S', 15, NULL, NULL),
  (108, 8, 'Trắng', '#FFFFFF', 'M', 15, NULL, NULL),
  (109, 8, 'Trắng', '#FFFFFF', 'L', 15, NULL, NULL),
  (110, 8, 'Trắng', '#FFFFFF', 'XL', 16, NULL, NULL),
  (111, 8, 'Xám', '#94A3B8', 'XS', 16, NULL, NULL),
  (112, 8, 'Xám', '#94A3B8', 'S', 15, NULL, NULL),
  (113, 8, 'Xám', '#94A3B8', 'M', 15, NULL, NULL),
  (114, 8, 'Xám', '#94A3B8', 'L', 15, NULL, NULL),
  (115, 8, 'Xám', '#94A3B8', 'XL', 16, NULL, NULL),
  (116, 8, 'Navy', '#1E293B', 'XS', 16, NULL, NULL),
  (117, 8, 'Navy', '#1E293B', 'S', 15, NULL, NULL),
  (118, 8, 'Navy', '#1E293B', 'M', 15, NULL, NULL),
  (119, 8, 'Navy', '#1E293B', 'L', 15, NULL, NULL),
  (120, 8, 'Navy', '#1E293B', 'XL', 16, NULL, NULL),
  (121, 9, 'Nâu', '#8B6F47', 'XS', 9, 460000, NULL),
  (122, 9, 'Nâu', '#8B6F47', 'S', 8, 460000, NULL),
  (123, 9, 'Nâu', '#8B6F47', 'M', 8, 460000, NULL),
  (124, 9, 'Nâu', '#8B6F47', 'L', 8, 480000, NULL),
  (125, 9, 'Nâu', '#8B6F47', 'XL', 9, 510000, NULL),
  (126, 9, 'Đen', '#111111', 'XS', 9, 430000, NULL),
  (127, 9, 'Đen', '#111111', 'S', 8, 430000, NULL),
  (128, 9, 'Đen', '#111111', 'M', 8, 430000, NULL),
  (129, 9, 'Đen', '#111111', 'L', 8, 450000, NULL),
  (130, 9, 'Đen', '#111111', 'XL', 9, 480000, NULL),
  (131, 9, 'Olive', '#6B7250', 'XS', 9, 430000, NULL),
  (132, 9, 'Olive', '#6B7250', 'S', 8, 430000, NULL),
  (133, 9, 'Olive', '#6B7250', 'M', 8, 430000, NULL),
  (134, 9, 'Olive', '#6B7250', 'L', 8, 450000, NULL),
  (135, 9, 'Olive', '#6B7250', 'XL', 9, 480000, NULL),
  (136, 10, 'Đen', '#111111', 'XS', 22, NULL, NULL),
  (137, 10, 'Đen', '#111111', 'S', 21, NULL, NULL),
  (138, 10, 'Đen', '#111111', 'M', 21, NULL, NULL),
  (139, 10, 'Đen', '#111111', 'L', 21, NULL, NULL),
  (140, 10, 'Đen', '#111111', 'XL', 22, NULL, NULL),
  (141, 10, 'Kem', '#EDE6D6', 'XS', 22, NULL, NULL),
  (142, 10, 'Kem', '#EDE6D6', 'S', 21, NULL, NULL),
  (143, 10, 'Kem', '#EDE6D6', 'M', 21, NULL, NULL),
  (144, 10, 'Kem', '#EDE6D6', 'L', 21, NULL, NULL),
  (145, 10, 'Kem', '#EDE6D6', 'XL', 22, NULL, NULL),
  (146, 10, 'Be', '#D6B98C', 'XS', 22, NULL, NULL),
  (147, 10, 'Be', '#D6B98C', 'S', 21, NULL, NULL),
  (148, 10, 'Be', '#D6B98C', 'M', 21, NULL, NULL),
  (149, 10, 'Be', '#D6B98C', 'L', 21, NULL, NULL),
  (150, 10, 'Be', '#D6B98C', 'XL', 22, NULL, NULL),
  (151, 11, 'Trắng', '#FFFFFF', 'XS', 15, NULL, NULL),
  (152, 11, 'Trắng', '#FFFFFF', 'S', 14, NULL, NULL),
  (153, 11, 'Trắng', '#FFFFFF', 'M', 14, NULL, NULL),
  (154, 11, 'Trắng', '#FFFFFF', 'L', 14, NULL, NULL),
  (155, 11, 'Trắng', '#FFFFFF', 'XL', 15, NULL, NULL),
  (156, 11, 'Xám', '#94A3B8', 'XS', 15, NULL, NULL),
  (157, 11, 'Xám', '#94A3B8', 'S', 14, NULL, NULL),
  (158, 11, 'Xám', '#94A3B8', 'M', 14, NULL, NULL),
  (159, 11, 'Xám', '#94A3B8', 'L', 14, NULL, NULL),
  (160, 11, 'Xám', '#94A3B8', 'XL', 15, NULL, NULL),
  (161, 11, 'Navy', '#1E293B', 'XS', 15, NULL, NULL),
  (162, 11, 'Navy', '#1E293B', 'S', 14, NULL, NULL),
  (163, 11, 'Navy', '#1E293B', 'M', 14, NULL, NULL),
  (164, 11, 'Navy', '#1E293B', 'L', 14, NULL, NULL),
  (165, 11, 'Navy', '#1E293B', 'XL', 15, NULL, NULL),
  (166, 12, 'Nâu', '#8B6F47', 'XS', 8, NULL, NULL),
  (167, 12, 'Nâu', '#8B6F47', 'S', 7, NULL, NULL),
  (168, 12, 'Nâu', '#8B6F47', 'M', 7, NULL, NULL),
  (169, 12, 'Nâu', '#8B6F47', 'L', 7, NULL, NULL),
  (170, 12, 'Nâu', '#8B6F47', 'XL', 8, NULL, NULL),
  (171, 12, 'Đen', '#111111', 'XS', 8, NULL, NULL),
  (172, 12, 'Đen', '#111111', 'S', 7, NULL, NULL),
  (173, 12, 'Đen', '#111111', 'M', 7, NULL, NULL),
  (174, 12, 'Đen', '#111111', 'L', 7, NULL, NULL),
  (175, 12, 'Đen', '#111111', 'XL', 8, NULL, NULL),
  (176, 12, 'Olive', '#6B7250', 'XS', 8, NULL, NULL),
  (177, 12, 'Olive', '#6B7250', 'S', 7, NULL, NULL),
  (178, 12, 'Olive', '#6B7250', 'M', 7, NULL, NULL),
  (179, 12, 'Olive', '#6B7250', 'L', 7, NULL, NULL),
  (180, 12, 'Olive', '#6B7250', 'XL', 8, NULL, NULL),
  (181, 13, 'Đen', '#111111', 'XS', 21, 435000, 540000),
  (182, 13, 'Đen', '#111111', 'S', 20, 435000, 540000),
  (183, 13, 'Đen', '#111111', 'M', 20, 435000, 540000),
  (184, 13, 'Đen', '#111111', 'L', 20, 455000, 560000),
  (185, 13, 'Đen', '#111111', 'XL', 21, 485000, 590000),
  (186, 13, 'Kem', '#EDE6D6', 'XS', 21, 405000, 540000),
  (187, 13, 'Kem', '#EDE6D6', 'S', 20, 405000, 540000),
  (188, 13, 'Kem', '#EDE6D6', 'M', 20, 405000, 540000),
  (189, 13, 'Kem', '#EDE6D6', 'L', 20, 425000, 560000),
  (190, 13, 'Kem', '#EDE6D6', 'XL', 21, 455000, 590000),
  (191, 13, 'Be', '#D6B98C', 'XS', 21, 405000, 540000),
  (192, 13, 'Be', '#D6B98C', 'S', 20, 405000, 540000),
  (193, 13, 'Be', '#D6B98C', 'M', 20, 405000, 540000),
  (194, 13, 'Be', '#D6B98C', 'L', 20, 425000, 560000),
  (195, 13, 'Be', '#D6B98C', 'XL', 21, 455000, 590000),
  (196, 14, 'Trắng', '#FFFFFF', 'XS', 14, NULL, NULL),
  (197, 14, 'Trắng', '#FFFFFF', 'S', 13, NULL, NULL),
  (198, 14, 'Trắng', '#FFFFFF', 'M', 13, NULL, NULL),
  (199, 14, 'Trắng', '#FFFFFF', 'L', 13, NULL, NULL),
  (200, 14, 'Trắng', '#FFFFFF', 'XL', 14, NULL, NULL),
  (201, 14, 'Xám', '#94A3B8', 'XS', 14, NULL, NULL),
  (202, 14, 'Xám', '#94A3B8', 'S', 13, NULL, NULL),
  (203, 14, 'Xám', '#94A3B8', 'M', 13, NULL, NULL),
  (204, 14, 'Xám', '#94A3B8', 'L', 13, NULL, NULL),
  (205, 14, 'Xám', '#94A3B8', 'XL', 14, NULL, NULL),
  (206, 14, 'Navy', '#1E293B', 'XS', 14, NULL, NULL),
  (207, 14, 'Navy', '#1E293B', 'S', 13, NULL, NULL),
  (208, 14, 'Navy', '#1E293B', 'M', 13, NULL, NULL),
  (209, 14, 'Navy', '#1E293B', 'L', 13, NULL, NULL),
  (210, 14, 'Navy', '#1E293B', 'XL', 14, NULL, NULL),
  (211, 15, 'Nâu', '#8B6F47', 'One Size', 13, NULL, NULL),
  (212, 15, 'Đen', '#111111', 'One Size', 13, NULL, NULL),
  (213, 15, 'Olive', '#6B7250', 'One Size', 13, NULL, NULL),
  (214, 16, 'Đen', '#111111', 'One Size', 6, NULL, NULL),
  (215, 16, 'Kem', '#EDE6D6', 'One Size', 6, NULL, NULL),
  (216, 16, 'Be', '#D6B98C', 'One Size', 6, NULL, NULL),
  (217, 17, 'Trắng', '#FFFFFF', 'XS', 13, 370000, NULL),
  (218, 17, 'Trắng', '#FFFFFF', 'S', 12, 370000, NULL),
  (219, 17, 'Trắng', '#FFFFFF', 'M', 12, 370000, NULL),
  (220, 17, 'Trắng', '#FFFFFF', 'L', 12, 390000, NULL),
  (221, 17, 'Trắng', '#FFFFFF', 'XL', 13, 420000, NULL),
  (222, 17, 'Xám', '#94A3B8', 'XS', 13, 340000, NULL),
  (223, 17, 'Xám', '#94A3B8', 'S', 12, 340000, NULL),
  (224, 17, 'Xám', '#94A3B8', 'M', 12, 340000, NULL),
  (225, 17, 'Xám', '#94A3B8', 'L', 12, 360000, NULL),
  (226, 17, 'Xám', '#94A3B8', 'XL', 13, 390000, NULL),
  (227, 17, 'Navy', '#1E293B', 'XS', 13, 340000, NULL),
  (228, 17, 'Navy', '#1E293B', 'S', 12, 340000, NULL),
  (229, 17, 'Navy', '#1E293B', 'M', 12, 340000, NULL),
  (230, 17, 'Navy', '#1E293B', 'L', 12, 360000, NULL),
  (231, 17, 'Navy', '#1E293B', 'XL', 13, 390000, NULL),
  (232, 18, 'Nâu', '#8B6F47', 'XS', 6, NULL, NULL),
  (233, 18, 'Nâu', '#8B6F47', 'S', 5, NULL, NULL),
  (234, 18, 'Nâu', '#8B6F47', 'M', 5, NULL, NULL),
  (235, 18, 'Nâu', '#8B6F47', 'L', 5, NULL, NULL),
  (236, 18, 'Nâu', '#8B6F47', 'XL', 6, NULL, NULL),
  (237, 18, 'Đen', '#111111', 'XS', 6, NULL, NULL),
  (238, 18, 'Đen', '#111111', 'S', 5, NULL, NULL),
  (239, 18, 'Đen', '#111111', 'M', 5, NULL, NULL),
  (240, 18, 'Đen', '#111111', 'L', 5, NULL, NULL),
  (241, 18, 'Đen', '#111111', 'XL', 6, NULL, NULL),
  (242, 18, 'Olive', '#6B7250', 'XS', 6, NULL, NULL),
  (243, 18, 'Olive', '#6B7250', 'S', 5, NULL, NULL),
  (244, 18, 'Olive', '#6B7250', 'M', 5, NULL, NULL),
  (245, 18, 'Olive', '#6B7250', 'L', 5, NULL, NULL),
  (246, 18, 'Olive', '#6B7250', 'XL', 6, NULL, NULL),
  (247, 19, 'Đen', '#111111', 'XS', 19, NULL, NULL),
  (248, 19, 'Đen', '#111111', 'S', 18, NULL, NULL),
  (249, 19, 'Đen', '#111111', 'M', 18, NULL, NULL),
  (250, 19, 'Đen', '#111111', 'L', 18, NULL, NULL),
  (251, 19, 'Đen', '#111111', 'XL', 19, NULL, NULL),
  (252, 19, 'Kem', '#EDE6D6', 'XS', 19, NULL, NULL),
  (253, 19, 'Kem', '#EDE6D6', 'S', 18, NULL, NULL),
  (254, 19, 'Kem', '#EDE6D6', 'M', 18, NULL, NULL),
  (255, 19, 'Kem', '#EDE6D6', 'L', 18, NULL, NULL),
  (256, 19, 'Kem', '#EDE6D6', 'XL', 19, NULL, NULL),
  (257, 19, 'Be', '#D6B98C', 'XS', 19, NULL, NULL),
  (258, 19, 'Be', '#D6B98C', 'S', 18, NULL, NULL),
  (259, 19, 'Be', '#D6B98C', 'M', 18, NULL, NULL),
  (260, 19, 'Be', '#D6B98C', 'L', 18, NULL, NULL),
  (261, 19, 'Be', '#D6B98C', 'XL', 19, NULL, NULL),
  (262, 20, 'Trắng', '#FFFFFF', 'XS', 12, NULL, NULL),
  (263, 20, 'Trắng', '#FFFFFF', 'S', 11, NULL, NULL),
  (264, 20, 'Trắng', '#FFFFFF', 'M', 11, NULL, NULL),
  (265, 20, 'Trắng', '#FFFFFF', 'L', 11, NULL, NULL),
  (266, 20, 'Trắng', '#FFFFFF', 'XL', 12, NULL, NULL),
  (267, 20, 'Xám', '#94A3B8', 'XS', 12, NULL, NULL),
  (268, 20, 'Xám', '#94A3B8', 'S', 11, NULL, NULL),
  (269, 20, 'Xám', '#94A3B8', 'M', 11, NULL, NULL),
  (270, 20, 'Xám', '#94A3B8', 'L', 11, NULL, NULL),
  (271, 20, 'Xám', '#94A3B8', 'XL', 12, NULL, NULL),
  (272, 20, 'Navy', '#1E293B', 'XS', 12, NULL, NULL),
  (273, 20, 'Navy', '#1E293B', 'S', 11, NULL, NULL),
  (274, 20, 'Navy', '#1E293B', 'M', 11, NULL, NULL),
  (275, 20, 'Navy', '#1E293B', 'L', 11, NULL, NULL),
  (276, 20, 'Navy', '#1E293B', 'XL', 12, NULL, NULL),
  (277, 21, 'Nâu', '#8B6F47', 'XS', 5, 950000, NULL),
  (278, 21, 'Nâu', '#8B6F47', 'S', 4, 950000, NULL),
  (279, 21, 'Nâu', '#8B6F47', 'M', 4, 950000, NULL),
  (280, 21, 'Nâu', '#8B6F47', 'L', 4, 970000, NULL),
  (281, 21, 'Nâu', '#8B6F47', 'XL', 5, 1000000, NULL),
  (282, 21, 'Đen', '#111111', 'XS', 5, 920000, NULL),
  (283, 21, 'Đen', '#111111', 'S', 4, 920000, NULL),
  (284, 21, 'Đen', '#111111', 'M', 4, 920000, NULL),
  (285, 21, 'Đen', '#111111', 'L', 4, 940000, NULL),
  (286, 21, 'Đen', '#111111', 'XL', 5, 970000, NULL),
  (287, 21, 'Olive', '#6B7250', 'XS', 5, 920000, NULL),
  (288, 21, 'Olive', '#6B7250', 'S', 4, 920000, NULL),
  (289, 21, 'Olive', '#6B7250', 'M', 4, 920000, NULL),
  (290, 21, 'Olive', '#6B7250', 'L', 4, 940000, NULL),
  (291, 21, 'Olive', '#6B7250', 'XL', 5, 970000, NULL),
  (292, 22, 'Đen', '#111111', 'XS', 18, NULL, NULL),
  (293, 22, 'Đen', '#111111', 'S', 17, NULL, NULL),
  (294, 22, 'Đen', '#111111', 'M', 17, NULL, NULL),
  (295, 22, 'Đen', '#111111', 'L', 17, NULL, NULL),
  (296, 22, 'Đen', '#111111', 'XL', 18, NULL, NULL),
  (297, 22, 'Kem', '#EDE6D6', 'XS', 18, NULL, NULL),
  (298, 22, 'Kem', '#EDE6D6', 'S', 17, NULL, NULL),
  (299, 22, 'Kem', '#EDE6D6', 'M', 17, NULL, NULL),
  (300, 22, 'Kem', '#EDE6D6', 'L', 17, NULL, NULL),
  (301, 22, 'Kem', '#EDE6D6', 'XL', 18, NULL, NULL),
  (302, 22, 'Be', '#D6B98C', 'XS', 18, NULL, NULL),
  (303, 22, 'Be', '#D6B98C', 'S', 17, NULL, NULL),
  (304, 22, 'Be', '#D6B98C', 'M', 17, NULL, NULL),
  (305, 22, 'Be', '#D6B98C', 'L', 17, NULL, NULL),
  (306, 22, 'Be', '#D6B98C', 'XL', 18, NULL, NULL),
  (307, 23, 'Trắng', '#FFFFFF', 'XS', 11, NULL, NULL),
  (308, 23, 'Trắng', '#FFFFFF', 'S', 10, NULL, NULL),
  (309, 23, 'Trắng', '#FFFFFF', 'M', 10, NULL, NULL),
  (310, 23, 'Trắng', '#FFFFFF', 'L', 10, NULL, NULL),
  (311, 23, 'Trắng', '#FFFFFF', 'XL', 11, NULL, NULL),
  (312, 23, 'Xám', '#94A3B8', 'XS', 11, NULL, NULL),
  (313, 23, 'Xám', '#94A3B8', 'S', 10, NULL, NULL),
  (314, 23, 'Xám', '#94A3B8', 'M', 10, NULL, NULL),
  (315, 23, 'Xám', '#94A3B8', 'L', 10, NULL, NULL),
  (316, 23, 'Xám', '#94A3B8', 'XL', 11, NULL, NULL),
  (317, 23, 'Navy', '#1E293B', 'XS', 11, NULL, NULL),
  (318, 23, 'Navy', '#1E293B', 'S', 10, NULL, NULL),
  (319, 23, 'Navy', '#1E293B', 'M', 10, NULL, NULL),
  (320, 23, 'Navy', '#1E293B', 'L', 10, NULL, NULL),
  (321, 23, 'Navy', '#1E293B', 'XL', 11, NULL, NULL),
  (322, 24, 'Nâu', '#8B6F47', 'One Size', 10, NULL, NULL),
  (323, 24, 'Đen', '#111111', 'One Size', 10, NULL, NULL),
  (324, 24, 'Olive', '#6B7250', 'One Size', 10, NULL, NULL);

-- 7. cart_items (chỉ còn variant_id — product suy ra qua variants.product_id)
INSERT INTO `cart_items` (`id`, `user_id`, `variant_id`, `quantity`) VALUES
  (1, 2, 63, 1),   -- variant 63 = sản phẩm 5 / Trắng / M
  (2, 2, 109, 2);  -- variant 109 = sản phẩm 8 / Trắng / L

-- 8. vouchers
INSERT INTO `vouchers` (`id`, `code`, `type`, `value`, `description`, `min_order`, `expiry`, `usage_limit`, `used_count`) VALUES
  (1, 'HOANGNHA15', 'percent', 15, 'Giảm 15% cho đơn hàng đầu tiên', 500000, '2026-12-31 00:00:00.000', 1000, 0),
  (2, 'FREESHIP', 'freeship', 0, 'Miễn phí vận chuyển toàn quốc', 300000, '2026-12-31 00:00:00.000', 1000, 0),
  (3, 'LUXURY100', 'fixed', 100000, 'Giảm 100.000đ cho đơn từ 1 triệu', 1000000, '2026-12-31 00:00:00.000', 1000, 0),
  (4, 'VIPGOLD20', 'percent', 20, 'Ưu đãi khách hàng thân thiết', 800000, '2026-12-31 00:00:00.000', 1, 1);

-- 9. orders (thanh toán đã gộp: payment_status/pay_code/paid_at/transaction_code)
INSERT INTO `orders` (`id`, `user_id`, `voucher_id`, `status`, `shipping_method`, `shipping_fee`, `discount`, `subtotal`, `total`, `receiver_name`, `receiver_phone`, `receiver_email`, `address_text`, `note`, `payment_method`, `payment_status`, `pay_code`, `pay_expires_at`, `paid_at`, `transaction_code`, `ship_carrier`, `tracking_code`, `shipped_at`, `delivered_at`, `created_at`) VALUES
  ('HN-24081', 2, NULL, 'shipping', 'standard', 0, 0, 1440000, 1440000, 'Trần Duy', '0901234567', 'duytran.220218@gmail.com', '86 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', NULL, 'qr', 'paid', 'HN24081AB7X', '2026-07-22 10:15:00.000', '2026-07-23 10:00:00.000', 'SEPAY1720000001', 'GHN Express', 'GHN512384756', '2026-07-24 10:00:00.000', NULL, '2026-07-22 10:00:00.000');

-- 10. order_items (chỉ còn variant_id + snapshot)
INSERT INTO `order_items` (`id`, `order_id`, `variant_id`, `name`, `price`, `quantity`, `color`, `size`, `image`) VALUES
  (1, 'HN-24081', 3, 'Áo khoác dạ Oversized Wool', 540000, 1, 'Đen', 'M', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80'),
  (2, 'HN-24081', 39, 'Sơ mi Linen Premium Trắng', 450000, 2, 'Đen', 'L', 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80');

-- 11. reviews (bắt buộc gắn variant — variant 16 = sản phẩm 2 / Trắng / XS)
INSERT INTO `reviews` (`id`, `user_id`, `variant_id`, `rating`, `title`, `content`, `admin_reply`, `approved`, `created_at`) VALUES
  (1, 2, 3, 5, 'Chất lượng vượt mong đợi', 'Chất vải dày dặn, đường may cực kỳ tinh tế. Mặc lên có cảm giác rất "đắt tiền".', NULL, 1, '2026-07-25 10:00:00.000'),
  (2, 2, 16, 5, 'Phong cách rất Zara, rất COS', 'Mình đã mua 3 lần và lần nào cũng hài lòng. Thiết kế tối giản nhưng khác biệt.', NULL, 1, '2026-07-25 10:00:00.000'),
  (3, 2, 39, 4, 'Dịch vụ tuyệt vời', 'Giao hàng nhanh, nhân viên tư vấn size chính xác. Blazer mặc vừa in.', 'Cảm ơn bạn đã tin tưởng Hoàng Nha!', 1, '2026-07-25 10:00:00.000');

-- 12. notifications
INSERT INTO `notifications` (`id`, `user_id`, `order_id`, `voucher_id`, `title`, `content`, `type`, `read`, `created_at`) VALUES
  (1, 2, 'HN-24081', NULL, 'Đơn hàng đang được giao', 'Đơn HN-24081 dự kiến giao vào ngày mai.', 'order', 0, '2026-07-25 10:00:00.000'),
  (2, 2, NULL, 1, 'Flash Sale cuối tuần', 'Giảm đến 50% cho BST Thu-Đông. Chỉ trong 48 giờ!', 'promo', 0, '2026-07-25 10:00:00.000');

-- 13. banners
INSERT INTO `banners` (`id`, `eyebrow`, `title`, `subtitle`, `image`, `cta`, `active`, `sort_order`) VALUES
  (1, 'Bộ sưu tập Thu — Đông 2026', 'Nghệ thuật của sự tối giản', 'Những thiết kế vượt thời gian, tôn vinh vẻ đẹp trong từng đường cắt.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80', 'Khám phá ngay', 1, 0),
  (2, 'New Season Essentials', 'Định nghĩa lại phong cách', 'Chất liệu cao cấp gặp gỡ ngôn ngữ thiết kế đương đại.', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=80', 'Mua sắm ngay', 1, 1),
  (3, 'Hoàng Nha Atelier', 'Sang trọng trong im lặng', 'Quiet luxury — khi chất lượng tự lên tiếng thay cho logo.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80', 'Xem bộ sưu tập', 1, 2);

SET FOREIGN_KEY_CHECKS = 1;
