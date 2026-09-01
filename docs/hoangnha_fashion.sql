-- ============================================================
-- Hoang Nha Fashion - CSDL `hoangnha_fashion` (13 bang + du lieu mau)
-- Sinh tu backend/prisma/schema.prisma ngay 01/09/2026
-- MySQL / MariaDB (XAMPP) - utf8mb4 - InnoDB
-- Import: phpMyAdmin > Import, hoac:  mysql -u root < hoangnha_fashion.sql
-- Ban danh cho HOSTING (khong xoa ca database): deploy/hoangnha_fashion.sql
-- ============================================================

SET NAMES utf8mb4;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

DROP DATABASE IF EXISTS `hoangnha_fashion`;
CREATE DATABASE `hoangnha_fashion` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hoangnha_fashion`;

/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `addresses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `label` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `street` varchar(191) NOT NULL,
  `ward` varchar(191) NOT NULL,
  `district` varchar(191) NOT NULL,
  `city` varchar(191) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `addresses_user_id_fkey` (`user_id`),
  CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,2,'Nhà riêng','Trần Duy','0901 234 567','86 Nguyễn Huệ','Phường Bến Nghé','Quận 1','TP. Hồ Chí Minh',1),(2,2,'Văn phòng','Trần Duy','0938 765 432','Tầng 12, Landmark 81, 720A Điện Biên Phủ','Phường 22','Quận Bình Thạnh','TP. Hồ Chí Minh',0);
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `eyebrow` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `subtitle` text NOT NULL,
  `image` text NOT NULL,
  `cta` varchar(191) NOT NULL DEFAULT 'Khám phá ngay',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (1,'Bộ sưu tập Thu — Đông 2026','Nghệ thuật của sự tối giản','Những thiết kế vượt thời gian, tôn vinh vẻ đẹp trong từng đường cắt.','https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80','Khám phá ngay',1,0),(2,'New Season Essentials','Định nghĩa lại phong cách','Chất liệu cao cấp gặp gỡ ngôn ngữ thiết kế đương đại.','https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=80','Mua sắm ngay',1,1),(3,'Hoàng Nha Atelier','Sang trọng trong im lặng','Quiet luxury — khi chất lượng tự lên tiếng thay cho logo.','https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80','Xem bộ sưu tập',1,2);
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cart_items_user_id_variant_id_key` (`user_id`,`variant_id`),
  KEY `cart_items_variant_id_fkey` (`variant_id`),
  CONSTRAINT `cart_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (1,2,63,1),(2,2,108,2);
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `image` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_key` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Áo khoác','ao-khoac','https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=80'),(2,'Đầm & Váy','dam-vay','https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80'),(3,'Sơ mi','so-mi','https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80'),(4,'Quần','quan','https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80'),(5,'Áo thun','ao-thun','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),(6,'Phụ kiện','phu-kien','https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=900&q=80');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `order_id` varchar(191) DEFAULT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'system',
  `read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_fkey` (`user_id`),
  KEY `notifications_order_id_fkey` (`order_id`),
  KEY `notifications_voucher_id_fkey` (`voucher_id`),
  CONSTRAINT `notifications_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifications_voucher_id_fkey` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'HN-24081',NULL,'Đơn hàng đang được giao','Đơn HN-24081 dự kiến giao vào ngày mai.','order',0,'2026-09-01 11:35:52.676'),(2,2,NULL,1,'Flash Sale cuối tuần 🔥','Giảm đến 50% cho BST Thu-Đông. Chỉ trong 48 giờ!','promo',0,'2026-09-01 11:35:52.676');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(191) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `price` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `color` varchar(191) NOT NULL,
  `size` varchar(191) NOT NULL,
  `image` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_fkey` (`order_id`),
  KEY `order_items_variant_id_fkey` (`variant_id`),
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,'HN-24081',14,'Áo khoác dạ Oversized Wool',540000,1,'Be','L','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80'),(2,'HN-24081',38,'Sơ mi Linen Premium Trắng',450000,2,'Đen','M','https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` varchar(191) NOT NULL,
  `user_id` int(11) NOT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'pending',
  `shipping_method` varchar(191) NOT NULL DEFAULT 'standard',
  `shipping_fee` int(11) NOT NULL DEFAULT 0,
  `discount` int(11) NOT NULL DEFAULT 0,
  `subtotal` int(11) NOT NULL,
  `total` int(11) NOT NULL,
  `receiver_name` varchar(191) NOT NULL,
  `receiver_phone` varchar(191) NOT NULL,
  `receiver_email` varchar(191) NOT NULL,
  `address_text` text NOT NULL,
  `note` text DEFAULT NULL,
  `payment_method` varchar(191) NOT NULL,
  `payment_status` varchar(191) NOT NULL DEFAULT 'pending',
  `pay_code` varchar(191) DEFAULT NULL,
  `pay_expires_at` datetime(3) DEFAULT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `transaction_code` varchar(191) DEFAULT NULL,
  `ship_carrier` varchar(191) DEFAULT NULL,
  `tracking_code` varchar(191) DEFAULT NULL,
  `shipped_at` datetime(3) DEFAULT NULL,
  `delivered_at` datetime(3) DEFAULT NULL,
  `cancel_reason` text DEFAULT NULL,
  `cancelled_by` varchar(191) DEFAULT NULL,
  `cancelled_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_pay_code_key` (`pay_code`),
  KEY `orders_user_id_fkey` (`user_id`),
  KEY `orders_voucher_id_fkey` (`voucher_id`),
  CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_voucher_id_fkey` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('HN-24081',2,NULL,'shipping','standard',0,0,1440000,1440000,'Trần Duy','0901234567','duytran.220218@gmail.com','86 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',NULL,'qr','paid','HN24081AB7X',NULL,'2026-08-30 11:35:52.624','SEPAY1720000001','GHN Express','GHN512384756','2026-08-31 11:35:52.624',NULL,NULL,NULL,NULL,'2026-09-01 11:35:52.625');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `url` text NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `product_images_product_id_fkey` (`product_id`),
  CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,1,'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',0),(2,1,'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',1),(3,1,'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',2),(4,1,'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80',3),(5,2,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',0),(6,2,'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',1),(7,2,'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',2),(8,2,'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80',3),(9,3,'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80',0),(10,3,'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80',1),(11,3,'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=900&q=80',2),(12,3,'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80',3),(13,4,'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',0),(14,4,'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80',1),(15,4,'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',2),(16,4,'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80',3),(17,5,'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',0),(18,5,'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',1),(19,5,'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',2),(20,5,'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',3),(21,6,'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',0),(22,6,'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',1),(23,6,'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',2),(24,6,'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',3),(25,7,'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',0),(26,7,'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',1),(27,7,'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80',2),(28,7,'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80',3),(29,8,'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80',0),(30,8,'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',1),(31,8,'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80',2),(32,8,'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',3),(33,9,'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80',0),(34,9,'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=900&q=80',1),(35,9,'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80',2),(36,9,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',3),(37,10,'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',0),(38,10,'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',1),(39,10,'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80',2),(40,10,'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80',3),(41,11,'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',0),(42,11,'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',1),(43,11,'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',2),(44,11,'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',3),(45,12,'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',0),(46,12,'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',1),(47,12,'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',2),(48,12,'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',3),(49,13,'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',0),(50,13,'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80',1),(51,13,'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80',2),(52,13,'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',3),(53,14,'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=900&q=80',0),(54,14,'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80',1),(55,14,'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',2),(56,14,'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',3),(57,15,'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',0),(58,15,'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80',1),(59,15,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',2),(60,15,'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80',3),(61,16,'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',0),(62,16,'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80',1),(63,16,'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80',2),(64,16,'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80',3),(65,17,'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',0),(66,17,'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',1),(67,17,'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',2),(68,17,'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',3),(69,18,'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80',0),(70,18,'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',1),(71,18,'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',2),(72,18,'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',3),(73,19,'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=900&q=80',0),(74,19,'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80',1),(75,19,'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',2),(76,19,'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',3),(77,20,'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80',0),(78,20,'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',1),(79,20,'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',2),(80,20,'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',3),(81,21,'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80',0),(82,21,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',1),(83,21,'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80',2),(84,21,'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=900&q=80',3),(85,22,'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',0),(86,22,'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=80',1),(87,22,'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=900&q=80',2),(88,22,'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',3),(89,23,'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',0),(90,23,'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',1),(91,23,'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',2),(92,23,'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',3),(93,24,'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80',0),(94,24,'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',1),(95,24,'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',2),(96,24,'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',3);
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `price` int(11) NOT NULL,
  `old_price` int(11) DEFAULT NULL,
  `brand` varchar(191) NOT NULL,
  `material` varchar(191) NOT NULL,
  `rating` double NOT NULL DEFAULT 0,
  `review_count` int(11) NOT NULL DEFAULT 0,
  `sold` int(11) NOT NULL DEFAULT 0,
  `is_new` tinyint(1) NOT NULL DEFAULT 0,
  `is_best_seller` tinyint(1) NOT NULL DEFAULT 0,
  `is_trending` tinyint(1) NOT NULL DEFAULT 0,
  `flash_sale` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_key` (`slug`),
  KEY `products_category_id_fkey` (`category_id`),
  CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,'Áo khoác dạ Oversized Wool','san-pham-1','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',540000,720000,'Hoàng Nha','Cotton hữu cơ',4,12,40,1,0,0,1,'2026-09-01 11:35:52.345'),(2,2,'Đầm lụa Midi Thanh Lịch','san-pham-2','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',890000,NULL,'HN Studio','Lụa tơ tằm',4.7,49,93,1,1,0,0,'2026-09-01 11:35:52.365'),(3,3,'Sơ mi Linen Premium Trắng','san-pham-3','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',450000,NULL,'Atelier HN','Linen Pháp',4.4,86,146,1,0,1,0,'2026-09-01 11:35:52.402'),(4,1,'Blazer Cấu Trúc Hiện Đại','san-pham-4','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',862500,1150000,'HN Essentials','Wool Ý',4.1,123,199,1,0,0,1,'2026-09-01 11:35:52.412'),(5,4,'Quần Âu Ống Suông Wide-leg','san-pham-5','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',520000,NULL,'Hoàng Nha','Cashmere',4.8,160,252,1,0,0,0,'2026-09-01 11:35:52.424'),(6,5,'Áo thun Cotton Supima Basic','san-pham-6','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',220000,NULL,'HN Studio','Denim Nhật',4.5,197,305,1,1,1,0,'2026-09-01 11:35:52.433'),(7,2,'Đầm Slip Satin Đêm Tiệc','san-pham-7','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',585000,780000,'Atelier HN','Cotton hữu cơ',4.2,14,358,1,0,0,1,'2026-09-01 11:35:52.441'),(8,1,'Cardigan Cashmere Mềm Mại','san-pham-8','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',960000,NULL,'HN Essentials','Lụa tơ tằm',4.9,51,411,1,0,0,0,'2026-09-01 11:35:52.449'),(9,2,'Chân váy Midi Xếp Ly','san-pham-9','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',430000,NULL,'Hoàng Nha','Linen Pháp',4.6,88,464,0,0,1,0,'2026-09-01 11:35:52.457'),(10,1,'Trench Coat Cổ Điển Beige','san-pham-10','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',1012500,1350000,'HN Studio','Wool Ý',4.3,125,517,0,1,0,1,'2026-09-01 11:35:52.466'),(11,3,'Sơ mi Oxford Regular Fit','san-pham-11','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',380000,NULL,'Atelier HN','Cashmere',4,162,570,0,0,0,0,'2026-09-01 11:35:52.474'),(12,4,'Quần Jeans Straight Vintage','san-pham-12','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',490000,NULL,'HN Essentials','Denim Nhật',4.7,199,623,0,0,1,0,'2026-09-01 11:35:52.487'),(13,5,'Áo len Merino Cổ Lọ','san-pham-13','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',405000,540000,'Hoàng Nha','Cotton hữu cơ',4.4,16,676,0,0,0,1,'2026-09-01 11:35:52.495'),(14,2,'Đầm Wrap Hoa Nhí Mùa Hè','san-pham-14','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',610000,NULL,'HN Studio','Lụa tơ tằm',4.1,53,729,0,1,0,0,'2026-09-01 11:35:52.503'),(15,6,'Túi Tote Da Minimal','san-pham-15','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',850000,NULL,'Atelier HN','Linen Pháp',4.8,90,782,0,0,1,0,'2026-09-01 11:35:52.512'),(16,6,'Khăn lụa Twill Họa Tiết','san-pham-16','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',240000,320000,'HN Essentials','Wool Ý',4.5,127,835,0,0,0,0,'2026-09-01 11:35:52.520'),(17,5,'Áo Polo Piqué Luxury','san-pham-17','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',340000,NULL,'Hoàng Nha','Cashmere',4.2,164,888,0,0,0,0,'2026-09-01 11:35:52.527'),(18,4,'Quần Short Linen Nghỉ Dưỡng','san-pham-18','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',290000,NULL,'HN Studio','Denim Nhật',4.9,201,41,0,1,1,0,'2026-09-01 11:35:52.535'),(19,1,'Vest Không Tay Smart Casual','san-pham-19','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',510000,680000,'Atelier HN','Cotton hữu cơ',4.6,18,94,0,0,0,0,'2026-09-01 11:35:52.548'),(20,3,'Sơ mi Lụa Tay Bồng','san-pham-20','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',560000,NULL,'HN Essentials','Lụa tơ tằm',4.3,55,147,0,0,0,0,'2026-09-01 11:35:52.558'),(21,2,'Đầm Maxi Cổ Yếm Sang Trọng','san-pham-21','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',920000,NULL,'Hoàng Nha','Linen Pháp',4,92,200,0,0,1,0,'2026-09-01 11:35:52.566'),(22,4,'Quần Culottes Thanh Lịch','san-pham-22','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',352500,470000,'HN Studio','Wool Ý',4.7,129,253,0,1,0,0,'2026-09-01 11:35:52.574'),(23,5,'Áo Hoodie Cotton Nặng Premium','san-pham-23','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',420000,NULL,'Atelier HN','Cashmere',4.4,166,306,0,0,0,0,'2026-09-01 11:35:52.582'),(24,6,'Belt Da Ý Khóa Kim Loại','san-pham-24','Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',380000,NULL,'HN Essentials','Denim Nhật',4.1,203,359,0,0,1,0,'2026-09-01 11:35:52.593');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `order_id` varchar(191) DEFAULT NULL,
  `rating` int(11) NOT NULL,
  `title` varchar(191) DEFAULT NULL,
  `content` text NOT NULL,
  `admin_reply` text DEFAULT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `reviews_order_id_variant_id_key` (`order_id`,`variant_id`),
  KEY `reviews_user_id_fkey` (`user_id`),
  KEY `reviews_variant_id_fkey` (`variant_id`),
  CONSTRAINT `reviews_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reviews_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,2,14,NULL,5,'Chất lượng vượt mong đợi','Chất vải dày dặn, đường may cực kỳ tinh tế. Mặc lên có cảm giác rất \"đắt tiền\".',NULL,1,'2026-09-01 11:35:52.638'),(2,2,16,NULL,5,'Phong cách rất Zara, rất COS','Mình đã mua 3 lần và lần nào cũng hài lòng. Thiết kế tối giản nhưng khác biệt.',NULL,1,'2026-09-01 11:35:52.642'),(3,2,38,NULL,4,'Dịch vụ tuyệt vời','Giao hàng nhanh, nhân viên tư vấn size chính xác. Blazer mặc vừa in.','Cảm ơn bạn đã tin tưởng Hoàng Nha!',1,'2026-09-01 11:35:52.648');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `avatar` varchar(191) DEFAULT NULL,
  `gender` varchar(191) DEFAULT NULL,
  `birthday` varchar(191) DEFAULT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'CUSTOMER',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Quản trị viên','admin@hoangnha.vn','$2b$10$xVv7gGABMkpa2v8BX/SFuOzgtgKU4KwMqNUtM4LzUEj8nvUnWBwaa',NULL,'https://i.pravatar.cc/160?img=13',NULL,NULL,'ADMIN','2026-09-01 11:35:52.256'),(2,'Trần Duy','duytran.220218@gmail.com','$2b$10$xWO6RKvLsTnH6Atx29AEXuR93063ZcqJ9xt53lOtlhqwF8OLA9Qve','0901234567','https://i.pravatar.cc/160?img=13','Nam','2002-02-18','CUSTOMER','2026-09-01 11:35:52.256');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `variants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `color` varchar(191) NOT NULL,
  `color_hex` varchar(191) NOT NULL,
  `size` varchar(191) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `price` int(11) DEFAULT NULL,
  `old_price` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `variants_product_id_color_size_key` (`product_id`,`color`,`size`),
  CONSTRAINT `variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=325 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `variants` WRITE;
/*!40000 ALTER TABLE `variants` DISABLE KEYS */;
INSERT INTO `variants` VALUES (1,1,'Đen','#111111','XS',5,570000,720000),(2,1,'Đen','#111111','S',4,570000,720000),(3,1,'Đen','#111111','M',4,570000,720000),(4,1,'Đen','#111111','L',4,590000,740000),(5,1,'Đen','#111111','XL',5,620000,770000),(6,1,'Kem','#EDE6D6','XS',5,540000,720000),(7,1,'Kem','#EDE6D6','S',4,540000,720000),(8,1,'Kem','#EDE6D6','M',4,540000,720000),(9,1,'Kem','#EDE6D6','L',4,560000,740000),(10,1,'Kem','#EDE6D6','XL',5,590000,770000),(11,1,'Be','#D6B98C','XS',5,540000,720000),(12,1,'Be','#D6B98C','S',4,540000,720000),(13,1,'Be','#D6B98C','M',4,540000,720000),(14,1,'Be','#D6B98C','L',4,560000,740000),(15,1,'Be','#D6B98C','XL',5,590000,770000),(16,2,'Trắng','#FFFFFF','XS',18,NULL,NULL),(17,2,'Trắng','#FFFFFF','S',17,NULL,NULL),(18,2,'Trắng','#FFFFFF','M',17,NULL,NULL),(19,2,'Trắng','#FFFFFF','L',17,NULL,NULL),(20,2,'Trắng','#FFFFFF','XL',18,NULL,NULL),(21,2,'Xám','#94A3B8','XS',18,NULL,NULL),(22,2,'Xám','#94A3B8','S',17,NULL,NULL),(23,2,'Xám','#94A3B8','M',17,NULL,NULL),(24,2,'Xám','#94A3B8','L',17,NULL,NULL),(25,2,'Xám','#94A3B8','XL',18,NULL,NULL),(26,2,'Navy','#1E293B','XS',18,NULL,NULL),(27,2,'Navy','#1E293B','S',17,NULL,NULL),(28,2,'Navy','#1E293B','M',17,NULL,NULL),(29,2,'Navy','#1E293B','L',17,NULL,NULL),(30,2,'Navy','#1E293B','XL',18,NULL,NULL),(31,3,'Nâu','#8B6F47','XS',11,NULL,NULL),(32,3,'Nâu','#8B6F47','S',10,NULL,NULL),(33,3,'Nâu','#8B6F47','M',10,NULL,NULL),(34,3,'Nâu','#8B6F47','L',10,NULL,NULL),(35,3,'Nâu','#8B6F47','XL',11,NULL,NULL),(36,3,'Đen','#111111','XS',11,NULL,NULL),(37,3,'Đen','#111111','S',10,NULL,NULL),(38,3,'Đen','#111111','M',10,NULL,NULL),(39,3,'Đen','#111111','L',10,NULL,NULL),(40,3,'Đen','#111111','XL',11,NULL,NULL),(41,3,'Olive','#6B7250','XS',11,NULL,NULL),(42,3,'Olive','#6B7250','S',10,NULL,NULL),(43,3,'Olive','#6B7250','M',10,NULL,NULL),(44,3,'Olive','#6B7250','L',10,NULL,NULL),(45,3,'Olive','#6B7250','XL',11,NULL,NULL),(46,4,'Đen','#111111','XS',4,NULL,NULL),(47,4,'Đen','#111111','S',3,NULL,NULL),(48,4,'Đen','#111111','M',3,NULL,NULL),(49,4,'Đen','#111111','L',3,NULL,NULL),(50,4,'Đen','#111111','XL',4,NULL,NULL),(51,4,'Kem','#EDE6D6','XS',4,NULL,NULL),(52,4,'Kem','#EDE6D6','S',3,NULL,NULL),(53,4,'Kem','#EDE6D6','M',3,NULL,NULL),(54,4,'Kem','#EDE6D6','L',3,NULL,NULL),(55,4,'Kem','#EDE6D6','XL',4,NULL,NULL),(56,4,'Be','#D6B98C','XS',4,NULL,NULL),(57,4,'Be','#D6B98C','S',3,NULL,NULL),(58,4,'Be','#D6B98C','M',3,NULL,NULL),(59,4,'Be','#D6B98C','L',3,NULL,NULL),(60,4,'Be','#D6B98C','XL',4,NULL,NULL),(61,5,'Trắng','#FFFFFF','XS',17,550000,NULL),(62,5,'Trắng','#FFFFFF','S',16,550000,NULL),(63,5,'Trắng','#FFFFFF','M',16,550000,NULL),(64,5,'Trắng','#FFFFFF','L',16,570000,NULL),(65,5,'Trắng','#FFFFFF','XL',17,600000,NULL),(66,5,'Xám','#94A3B8','XS',17,520000,NULL),(67,5,'Xám','#94A3B8','S',16,520000,NULL),(68,5,'Xám','#94A3B8','M',16,520000,NULL),(69,5,'Xám','#94A3B8','L',16,540000,NULL),(70,5,'Xám','#94A3B8','XL',17,570000,NULL),(71,5,'Navy','#1E293B','XS',17,520000,NULL),(72,5,'Navy','#1E293B','S',16,520000,NULL),(73,5,'Navy','#1E293B','M',16,520000,NULL),(74,5,'Navy','#1E293B','L',16,540000,NULL),(75,5,'Navy','#1E293B','XL',17,570000,NULL),(76,6,'Nâu','#8B6F47','XS',10,NULL,NULL),(77,6,'Nâu','#8B6F47','S',9,NULL,NULL),(78,6,'Nâu','#8B6F47','M',9,NULL,NULL),(79,6,'Nâu','#8B6F47','L',9,NULL,NULL),(80,6,'Nâu','#8B6F47','XL',10,NULL,NULL),(81,6,'Đen','#111111','XS',10,NULL,NULL),(82,6,'Đen','#111111','S',9,NULL,NULL),(83,6,'Đen','#111111','M',9,NULL,NULL),(84,6,'Đen','#111111','L',9,NULL,NULL),(85,6,'Đen','#111111','XL',10,NULL,NULL),(86,6,'Olive','#6B7250','XS',10,NULL,NULL),(87,6,'Olive','#6B7250','S',9,NULL,NULL),(88,6,'Olive','#6B7250','M',9,NULL,NULL),(89,6,'Olive','#6B7250','L',9,NULL,NULL),(90,6,'Olive','#6B7250','XL',10,NULL,NULL),(91,7,'Đen','#111111','XS',3,NULL,NULL),(92,7,'Đen','#111111','S',22,NULL,NULL),(93,7,'Đen','#111111','M',22,NULL,NULL),(94,7,'Đen','#111111','L',22,NULL,NULL),(95,7,'Đen','#111111','XL',3,NULL,NULL),(96,7,'Kem','#EDE6D6','XS',3,NULL,NULL),(97,7,'Kem','#EDE6D6','S',22,NULL,NULL),(98,7,'Kem','#EDE6D6','M',22,NULL,NULL),(99,7,'Kem','#EDE6D6','L',22,NULL,NULL),(100,7,'Kem','#EDE6D6','XL',3,NULL,NULL),(101,7,'Be','#D6B98C','XS',3,NULL,NULL),(102,7,'Be','#D6B98C','S',22,NULL,NULL),(103,7,'Be','#D6B98C','M',22,NULL,NULL),(104,7,'Be','#D6B98C','L',22,NULL,NULL),(105,7,'Be','#D6B98C','XL',3,NULL,NULL),(106,8,'Trắng','#FFFFFF','XS',16,NULL,NULL),(107,8,'Trắng','#FFFFFF','S',15,NULL,NULL),(108,8,'Trắng','#FFFFFF','M',15,NULL,NULL),(109,8,'Trắng','#FFFFFF','L',15,NULL,NULL),(110,8,'Trắng','#FFFFFF','XL',16,NULL,NULL),(111,8,'Xám','#94A3B8','XS',16,NULL,NULL),(112,8,'Xám','#94A3B8','S',15,NULL,NULL),(113,8,'Xám','#94A3B8','M',15,NULL,NULL),(114,8,'Xám','#94A3B8','L',15,NULL,NULL),(115,8,'Xám','#94A3B8','XL',16,NULL,NULL),(116,8,'Navy','#1E293B','XS',16,NULL,NULL),(117,8,'Navy','#1E293B','S',15,NULL,NULL),(118,8,'Navy','#1E293B','M',15,NULL,NULL),(119,8,'Navy','#1E293B','L',15,NULL,NULL),(120,8,'Navy','#1E293B','XL',16,NULL,NULL),(121,9,'Nâu','#8B6F47','XS',9,460000,NULL),(122,9,'Nâu','#8B6F47','S',8,460000,NULL),(123,9,'Nâu','#8B6F47','M',8,460000,NULL),(124,9,'Nâu','#8B6F47','L',8,480000,NULL),(125,9,'Nâu','#8B6F47','XL',9,510000,NULL),(126,9,'Đen','#111111','XS',9,430000,NULL),(127,9,'Đen','#111111','S',8,430000,NULL),(128,9,'Đen','#111111','M',8,430000,NULL),(129,9,'Đen','#111111','L',8,450000,NULL),(130,9,'Đen','#111111','XL',9,480000,NULL),(131,9,'Olive','#6B7250','XS',9,430000,NULL),(132,9,'Olive','#6B7250','S',8,430000,NULL),(133,9,'Olive','#6B7250','M',8,430000,NULL),(134,9,'Olive','#6B7250','L',8,450000,NULL),(135,9,'Olive','#6B7250','XL',9,480000,NULL),(136,10,'Đen','#111111','XS',22,NULL,NULL),(137,10,'Đen','#111111','S',21,NULL,NULL),(138,10,'Đen','#111111','M',21,NULL,NULL),(139,10,'Đen','#111111','L',21,NULL,NULL),(140,10,'Đen','#111111','XL',22,NULL,NULL),(141,10,'Kem','#EDE6D6','XS',22,NULL,NULL),(142,10,'Kem','#EDE6D6','S',21,NULL,NULL),(143,10,'Kem','#EDE6D6','M',21,NULL,NULL),(144,10,'Kem','#EDE6D6','L',21,NULL,NULL),(145,10,'Kem','#EDE6D6','XL',22,NULL,NULL),(146,10,'Be','#D6B98C','XS',22,NULL,NULL),(147,10,'Be','#D6B98C','S',21,NULL,NULL),(148,10,'Be','#D6B98C','M',21,NULL,NULL),(149,10,'Be','#D6B98C','L',21,NULL,NULL),(150,10,'Be','#D6B98C','XL',22,NULL,NULL),(151,11,'Trắng','#FFFFFF','XS',15,NULL,NULL),(152,11,'Trắng','#FFFFFF','S',14,NULL,NULL),(153,11,'Trắng','#FFFFFF','M',14,NULL,NULL),(154,11,'Trắng','#FFFFFF','L',14,NULL,NULL),(155,11,'Trắng','#FFFFFF','XL',15,NULL,NULL),(156,11,'Xám','#94A3B8','XS',15,NULL,NULL),(157,11,'Xám','#94A3B8','S',14,NULL,NULL),(158,11,'Xám','#94A3B8','M',14,NULL,NULL),(159,11,'Xám','#94A3B8','L',14,NULL,NULL),(160,11,'Xám','#94A3B8','XL',15,NULL,NULL),(161,11,'Navy','#1E293B','XS',15,NULL,NULL),(162,11,'Navy','#1E293B','S',14,NULL,NULL),(163,11,'Navy','#1E293B','M',14,NULL,NULL),(164,11,'Navy','#1E293B','L',14,NULL,NULL),(165,11,'Navy','#1E293B','XL',15,NULL,NULL),(166,12,'Nâu','#8B6F47','XS',8,NULL,NULL),(167,12,'Nâu','#8B6F47','S',7,NULL,NULL),(168,12,'Nâu','#8B6F47','M',7,NULL,NULL),(169,12,'Nâu','#8B6F47','L',7,NULL,NULL),(170,12,'Nâu','#8B6F47','XL',8,NULL,NULL),(171,12,'Đen','#111111','XS',8,NULL,NULL),(172,12,'Đen','#111111','S',7,NULL,NULL),(173,12,'Đen','#111111','M',7,NULL,NULL),(174,12,'Đen','#111111','L',7,NULL,NULL),(175,12,'Đen','#111111','XL',8,NULL,NULL),(176,12,'Olive','#6B7250','XS',8,NULL,NULL),(177,12,'Olive','#6B7250','S',7,NULL,NULL),(178,12,'Olive','#6B7250','M',7,NULL,NULL),(179,12,'Olive','#6B7250','L',7,NULL,NULL),(180,12,'Olive','#6B7250','XL',8,NULL,NULL),(181,13,'Đen','#111111','XS',21,435000,540000),(182,13,'Đen','#111111','S',20,435000,540000),(183,13,'Đen','#111111','M',20,435000,540000),(184,13,'Đen','#111111','L',20,455000,560000),(185,13,'Đen','#111111','XL',21,485000,590000),(186,13,'Kem','#EDE6D6','XS',21,405000,540000),(187,13,'Kem','#EDE6D6','S',20,405000,540000),(188,13,'Kem','#EDE6D6','M',20,405000,540000),(189,13,'Kem','#EDE6D6','L',20,425000,560000),(190,13,'Kem','#EDE6D6','XL',21,455000,590000),(191,13,'Be','#D6B98C','XS',21,405000,540000),(192,13,'Be','#D6B98C','S',20,405000,540000),(193,13,'Be','#D6B98C','M',20,405000,540000),(194,13,'Be','#D6B98C','L',20,425000,560000),(195,13,'Be','#D6B98C','XL',21,455000,590000),(196,14,'Trắng','#FFFFFF','XS',14,NULL,NULL),(197,14,'Trắng','#FFFFFF','S',13,NULL,NULL),(198,14,'Trắng','#FFFFFF','M',13,NULL,NULL),(199,14,'Trắng','#FFFFFF','L',13,NULL,NULL),(200,14,'Trắng','#FFFFFF','XL',14,NULL,NULL),(201,14,'Xám','#94A3B8','XS',14,NULL,NULL),(202,14,'Xám','#94A3B8','S',13,NULL,NULL),(203,14,'Xám','#94A3B8','M',13,NULL,NULL),(204,14,'Xám','#94A3B8','L',13,NULL,NULL),(205,14,'Xám','#94A3B8','XL',14,NULL,NULL),(206,14,'Navy','#1E293B','XS',14,NULL,NULL),(207,14,'Navy','#1E293B','S',13,NULL,NULL),(208,14,'Navy','#1E293B','M',13,NULL,NULL),(209,14,'Navy','#1E293B','L',13,NULL,NULL),(210,14,'Navy','#1E293B','XL',14,NULL,NULL),(211,15,'Nâu','#8B6F47','One Size',13,NULL,NULL),(212,15,'Đen','#111111','One Size',13,NULL,NULL),(213,15,'Olive','#6B7250','One Size',13,NULL,NULL),(214,16,'Đen','#111111','One Size',6,NULL,NULL),(215,16,'Kem','#EDE6D6','One Size',6,NULL,NULL),(216,16,'Be','#D6B98C','One Size',6,NULL,NULL),(217,17,'Trắng','#FFFFFF','XS',13,370000,NULL),(218,17,'Trắng','#FFFFFF','S',12,370000,NULL),(219,17,'Trắng','#FFFFFF','M',12,370000,NULL),(220,17,'Trắng','#FFFFFF','L',12,390000,NULL),(221,17,'Trắng','#FFFFFF','XL',13,420000,NULL),(222,17,'Xám','#94A3B8','XS',13,340000,NULL),(223,17,'Xám','#94A3B8','S',12,340000,NULL),(224,17,'Xám','#94A3B8','M',12,340000,NULL),(225,17,'Xám','#94A3B8','L',12,360000,NULL),(226,17,'Xám','#94A3B8','XL',13,390000,NULL),(227,17,'Navy','#1E293B','XS',13,340000,NULL),(228,17,'Navy','#1E293B','S',12,340000,NULL),(229,17,'Navy','#1E293B','M',12,340000,NULL),(230,17,'Navy','#1E293B','L',12,360000,NULL),(231,17,'Navy','#1E293B','XL',13,390000,NULL),(232,18,'Nâu','#8B6F47','XS',6,NULL,NULL),(233,18,'Nâu','#8B6F47','S',5,NULL,NULL),(234,18,'Nâu','#8B6F47','M',5,NULL,NULL),(235,18,'Nâu','#8B6F47','L',5,NULL,NULL),(236,18,'Nâu','#8B6F47','XL',6,NULL,NULL),(237,18,'Đen','#111111','XS',6,NULL,NULL),(238,18,'Đen','#111111','S',5,NULL,NULL),(239,18,'Đen','#111111','M',5,NULL,NULL),(240,18,'Đen','#111111','L',5,NULL,NULL),(241,18,'Đen','#111111','XL',6,NULL,NULL),(242,18,'Olive','#6B7250','XS',6,NULL,NULL),(243,18,'Olive','#6B7250','S',5,NULL,NULL),(244,18,'Olive','#6B7250','M',5,NULL,NULL),(245,18,'Olive','#6B7250','L',5,NULL,NULL),(246,18,'Olive','#6B7250','XL',6,NULL,NULL),(247,19,'Đen','#111111','XS',19,NULL,NULL),(248,19,'Đen','#111111','S',18,NULL,NULL),(249,19,'Đen','#111111','M',18,NULL,NULL),(250,19,'Đen','#111111','L',18,NULL,NULL),(251,19,'Đen','#111111','XL',19,NULL,NULL),(252,19,'Kem','#EDE6D6','XS',19,NULL,NULL),(253,19,'Kem','#EDE6D6','S',18,NULL,NULL),(254,19,'Kem','#EDE6D6','M',18,NULL,NULL),(255,19,'Kem','#EDE6D6','L',18,NULL,NULL),(256,19,'Kem','#EDE6D6','XL',19,NULL,NULL),(257,19,'Be','#D6B98C','XS',19,NULL,NULL),(258,19,'Be','#D6B98C','S',18,NULL,NULL),(259,19,'Be','#D6B98C','M',18,NULL,NULL),(260,19,'Be','#D6B98C','L',18,NULL,NULL),(261,19,'Be','#D6B98C','XL',19,NULL,NULL),(262,20,'Trắng','#FFFFFF','XS',12,NULL,NULL),(263,20,'Trắng','#FFFFFF','S',11,NULL,NULL),(264,20,'Trắng','#FFFFFF','M',11,NULL,NULL),(265,20,'Trắng','#FFFFFF','L',11,NULL,NULL),(266,20,'Trắng','#FFFFFF','XL',12,NULL,NULL),(267,20,'Xám','#94A3B8','XS',12,NULL,NULL),(268,20,'Xám','#94A3B8','S',11,NULL,NULL),(269,20,'Xám','#94A3B8','M',11,NULL,NULL),(270,20,'Xám','#94A3B8','L',11,NULL,NULL),(271,20,'Xám','#94A3B8','XL',12,NULL,NULL),(272,20,'Navy','#1E293B','XS',12,NULL,NULL),(273,20,'Navy','#1E293B','S',11,NULL,NULL),(274,20,'Navy','#1E293B','M',11,NULL,NULL),(275,20,'Navy','#1E293B','L',11,NULL,NULL),(276,20,'Navy','#1E293B','XL',12,NULL,NULL),(277,21,'Nâu','#8B6F47','XS',5,950000,NULL),(278,21,'Nâu','#8B6F47','S',4,950000,NULL),(279,21,'Nâu','#8B6F47','M',4,950000,NULL),(280,21,'Nâu','#8B6F47','L',4,970000,NULL),(281,21,'Nâu','#8B6F47','XL',5,1000000,NULL),(282,21,'Đen','#111111','XS',5,920000,NULL),(283,21,'Đen','#111111','S',4,920000,NULL),(284,21,'Đen','#111111','M',4,920000,NULL),(285,21,'Đen','#111111','L',4,940000,NULL),(286,21,'Đen','#111111','XL',5,970000,NULL),(287,21,'Olive','#6B7250','XS',5,920000,NULL),(288,21,'Olive','#6B7250','S',4,920000,NULL),(289,21,'Olive','#6B7250','M',4,920000,NULL),(290,21,'Olive','#6B7250','L',4,940000,NULL),(291,21,'Olive','#6B7250','XL',5,970000,NULL),(292,22,'Đen','#111111','XS',18,NULL,NULL),(293,22,'Đen','#111111','S',17,NULL,NULL),(294,22,'Đen','#111111','M',17,NULL,NULL),(295,22,'Đen','#111111','L',17,NULL,NULL),(296,22,'Đen','#111111','XL',18,NULL,NULL),(297,22,'Kem','#EDE6D6','XS',18,NULL,NULL),(298,22,'Kem','#EDE6D6','S',17,NULL,NULL),(299,22,'Kem','#EDE6D6','M',17,NULL,NULL),(300,22,'Kem','#EDE6D6','L',17,NULL,NULL),(301,22,'Kem','#EDE6D6','XL',18,NULL,NULL),(302,22,'Be','#D6B98C','XS',18,NULL,NULL),(303,22,'Be','#D6B98C','S',17,NULL,NULL),(304,22,'Be','#D6B98C','M',17,NULL,NULL),(305,22,'Be','#D6B98C','L',17,NULL,NULL),(306,22,'Be','#D6B98C','XL',18,NULL,NULL),(307,23,'Trắng','#FFFFFF','XS',11,NULL,NULL),(308,23,'Trắng','#FFFFFF','S',10,NULL,NULL),(309,23,'Trắng','#FFFFFF','M',10,NULL,NULL),(310,23,'Trắng','#FFFFFF','L',10,NULL,NULL),(311,23,'Trắng','#FFFFFF','XL',11,NULL,NULL),(312,23,'Xám','#94A3B8','XS',11,NULL,NULL),(313,23,'Xám','#94A3B8','S',10,NULL,NULL),(314,23,'Xám','#94A3B8','M',10,NULL,NULL),(315,23,'Xám','#94A3B8','L',10,NULL,NULL),(316,23,'Xám','#94A3B8','XL',11,NULL,NULL),(317,23,'Navy','#1E293B','XS',11,NULL,NULL),(318,23,'Navy','#1E293B','S',10,NULL,NULL),(319,23,'Navy','#1E293B','M',10,NULL,NULL),(320,23,'Navy','#1E293B','L',10,NULL,NULL),(321,23,'Navy','#1E293B','XL',11,NULL,NULL),(322,24,'Nâu','#8B6F47','One Size',10,NULL,NULL),(323,24,'Đen','#111111','One Size',10,NULL,NULL),(324,24,'Olive','#6B7250','One Size',10,NULL,NULL);
/*!40000 ALTER TABLE `variants` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `value` int(11) NOT NULL,
  `description` varchar(191) NOT NULL,
  `min_order` int(11) NOT NULL DEFAULT 0,
  `start_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `end_date` datetime(3) NOT NULL,
  `usage_limit` int(11) NOT NULL DEFAULT 1000,
  `used_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vouchers_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'HOANGNHA15','percent',15,'Giảm 15% cho đơn hàng đầu tiên',500000,'2026-01-01 00:00:00.000','2026-12-31 00:00:00.000',1000,0),(2,'FREESHIP','freeship',0,'Miễn phí vận chuyển toàn quốc',300000,'2026-01-01 00:00:00.000','2026-12-31 00:00:00.000',1000,0),(3,'LUXURY100','fixed',100000,'Giảm 100.000đ cho đơn từ 1 triệu',1000000,'2026-01-01 00:00:00.000','2026-12-31 00:00:00.000',1000,0),(4,'VIPGOLD20','percent',20,'Ưu đãi khách hàng thân thiết',800000,'2026-01-01 00:00:00.000','2026-12-31 00:00:00.000',1,1);
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


-- ============================================================
-- Tai khoan mau (mat khau da bam bcrypt):
--   Admin   : admin@hoangnha.vn        / admin1234
--   Khach   : duytran.220218@gmail.com / 12345678
-- >>> DOI MAT KHAU ADMIN NGAY sau khi web chay that <<<
--     (dang nhap > Tai khoan > Doi mat khau)
-- ============================================================
