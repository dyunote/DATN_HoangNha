-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8080
-- Generation Time: Jun 13, 2026 at 03:01 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `50_sanpham`
--

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `gender` enum('Nam','Nữ','Unisex') DEFAULT 'Unisex',
  `material` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `name`, `gender`, `material`, `description`, `price`, `stock`, `image_url`, `created_at`) VALUES
(2, 1, '(Combo áo khoát không nón xanh than + xanh kẻ sọc)Nữ chống nắng khóa kéo', 'Nam', 'Nỉ Cotton', 'Áo khoác nam chất liệu nỉ cotton cao cấp', 350000.00, 50, '', '2026-06-13 11:15:18'),
(3, 1, 'Áo khoác 6 túi xanh ngọc phối viền bản, nữ chống nắng nỉ khóa kéo(2trong, 2 túi ngoài)', 'Nam', 'Nỉ Cotton', 'Áo khoác nam form rộng trẻ trung', 370000.00, 40, '', '2026-06-13 11:16:21'),
(4, 1, 'Áo khoát 6 túi xanh đen viền bản phối, nữ chống nắng nỉ khóa kéo', 'Nam', 'Nỉ Cotton', 'Áo khoác nam có nón tiện dụng', 390000.00, 35, '', '2026-06-13 11:16:21'),
(5, 1, 'Áo khoát 6 túi xanh trà, nữ chống nắng nỉ khóa kéo\r\n', 'Nam', 'Su Gân', 'Áo khoác nam su gân không nón', 340000.00, 45, '', '2026-06-13 11:16:21'),
(6, 1, 'Áo khoát gân đủa có nón hàng 4 túi', 'Nam', 'Su Gân', 'Áo khoác thể thao nam năng động', 420000.00, 30, '', '2026-06-13 11:16:21'),
(7, 1, 'Áo khoát nữ lót lụa phong cách thể thao cá tính phối viền', 'Nam', 'Tổng Hợp', 'Phong cách Hàn Quốc hiện đại', 450000.00, 25, '', '2026-06-13 11:16:21'),
(8, 1, '(Combo 2 áo khoác nỉ 6 túi đỏ rượu +đen) Nữ chống nắng khóa kéo', 'Nam', 'Tổng Hợp', 'Áo khoác nam cao cấp sang trọng', 550000.00, 20, '', '2026-06-13 11:16:21'),
(9, 1, '(Combo 2 áo khoát gân 6 túi nâu tây + đen) Nữ chống nắng khóa kéo', 'Nam', 'Tổng Hợp', 'Chống tia UV hiệu quả', 320000.00, 60, '', '2026-06-13 11:16:21'),
(10, 1, '(Combo 2 áo khoát POLY su viền đen+xanh rêu thêu chữ không nón, nữ chống nắng khóa kéo ngoài) có xỏ ngón tay', 'Nam', 'Nỉ Cotton', 'Khóa kéo chắc chắn', 400000.00, 30, '', '2026-06-13 11:16:21'),
(11, 1, 'Áo khoát su loại 1 s2( không nón ) from ôm mặt gym, yoga chất liệu su ôm body có xỏ ngón', 'Nam', 'Su Gân', 'Phong cách thường ngày', 380000.00, 40, '', '2026-06-13 11:16:21'),
(12, 1, 'Áo khoát thun umi chạy viền', 'Nữ', 'Nỉ Cotton', 'Áo khoác nữ đơn giản', 340000.00, 55, '', '2026-06-13 11:16:21'),
(13, 1, 'Áo thun nam nữ phối họa tiết viền vai form chuẩn chất vải cotton dày dặn  co giãn nhẹ mẫu mới nhất hot trend', 'Nữ', 'Nỉ Cotton', 'Form rộng thời trang', 360000.00, 45, '', '2026-06-13 11:16:21'),
(14, 1, 'combo 3 quần đùi ngẫu nhiên ống rộng chất tuyết mưa', 'Nữ', 'Nỉ Cotton', 'Có nón chống nắng', 390000.00, 35, '', '2026-06-13 11:16:21'),
(15, 1, 'Áo khoát nam 4 túi, PC nam chống nắng, không nón + khóa kéo(2 túi ngoài, 2 túi trong)', 'Nữ', 'Su Gân', 'Thiết kế thanh lịch', 350000.00, 40, '', '2026-06-13 11:16:21'),
(16, 1, 'Áo khoát nỉ cổ cao tay phối viền 3 màu cầu vòng Basic phong cách mới( có túi trong tay xỏ ngón chống nắng )', 'Nữ', 'Tổng Hợp', 'Chống nắng UV cao cấp', 290000.00, 70, '', '2026-06-13 11:16:21'),
(17, 1, 'combo 2 quần đùi đen nam', 'Nữ', 'Tổng Hợp', 'Mỏng nhẹ thoáng khí', 350000.00, 50, '', '2026-06-13 11:16:21'),
(18, 1, 'áo lẻ cổ lọ tay hiến phong cách hàn quốc', 'Nữ', 'Su Gân', 'Thiết kế trẻ trung', 420000.00, 30, '', '2026-06-13 11:16:21'),
(19, 1, 'bộ 2 dây chất liệu cotton cực mát co dãn 4 chiều thấm hút mồ hôi', 'Nữ', 'Nỉ Cotton', 'Kiểu croptop năng động', 380000.00, 25, '', '2026-06-13 11:16:21'),
(20, 1, 'áo khoác 4 túi , nữ chống nắng nĩ có nón khóa kéo(2trong, 2 túi ngoài)', 'Nữ', 'Tổng Hợp', 'Phong cách thể thao', 400000.00, 35, '', '2026-06-13 11:16:21'),
(21, 1, 'Khoác 4 túi POLY FORM thể thao (không nón) + chống nắng', 'Nữ', 'Nỉ Cotton', 'Khóa kéo bền đẹp', 390000.00, 30, '', '2026-06-13 11:16:21'),
(22, 2, '(Áo lẻ) xốp nhung size 40-65kg', 'Nữ', 'Cotton', 'Set bộ cổ vuông ống suông rộng', 450000.00, 30, '', '2026-06-13 11:16:21'),
(23, 2, 'combo 2 áo khoát nỉ 6 túi xanh rêu đậm  + đen', 'Nữ', 'Cotton', 'Thiết kế tay ngắn trẻ trung', 470000.00, 25, '', '2026-06-13 11:16:21'),
(24, 2, 'Set Bộ Cổ Vuông Vintage', 'Nữ', 'Su Gân', 'Phong cách vintage', 490000.00, 20, '', '2026-06-13 11:16:21'),
(25, 2, 'Set Bộ Cổ Vuông Cao Cấp', 'Nữ', 'Cotton', 'Chất liệu cotton cao cấp', 550000.00, 15, '', '2026-06-13 11:16:21'),
(26, 2, 'Set Bộ Cổ Vuông Công Sở', 'Nữ', 'Cotton', 'Phù hợp môi trường công sở', 520000.00, 18, '', '2026-06-13 11:16:21'),
(27, 2, 'Set Bộ Cổ Vuông Hàn Quốc', 'Nữ', 'Su Gân', 'Thiết kế Hàn Quốc', 500000.00, 20, '', '2026-06-13 11:16:21'),
(28, 2, 'Set Bộ Ống Suông Basic', 'Nữ', 'Cotton', 'Kiểu dáng basic', 460000.00, 25, '', '2026-06-13 11:16:21'),
(29, 2, 'Set Bộ Ống Suông Dài', 'Nữ', 'Cotton', 'Ống suông dài thanh lịch', 480000.00, 22, '', '2026-06-13 11:16:21'),
(30, 2, 'Set Bộ Dự Tiệc', 'Nữ', 'Su Gân', 'Thích hợp dự tiệc', 590000.00, 12, '', '2026-06-13 11:16:21'),
(31, 2, 'Set Bộ Form Rộng', 'Nữ', 'Cotton', 'Form rộng thoải mái', 510000.00, 20, '', '2026-06-13 11:16:21'),
(32, 3, 'Set Bộ Áo 2 Dây Basic', 'Nữ', 'Cotton', 'Set áo 2 dây đơn giản', 390000.00, 35, '', '2026-06-13 11:16:21'),
(33, 3, 'Set Bộ Áo 2 Dây Hàn Quốc', 'Nữ', 'Cotton', 'Phong cách Hàn Quốc', 420000.00, 30, '', '2026-06-13 11:16:21'),
(34, 3, 'Set Bộ Áo 2 Dây Dạo Phố', 'Nữ', 'Su Gân', 'Trang phục dạo phố', 450000.00, 25, '', '2026-06-13 11:16:21'),
(35, 3, 'Set Bộ Áo 2 Dây Cao Cấp', 'Nữ', 'Cotton', 'Chất liệu cao cấp', 520000.00, 15, '', '2026-06-13 11:16:21'),
(36, 3, 'Set Bộ Áo 2 Dây Mùa Hè', 'Nữ', 'Cotton', 'Mặc mùa hè thoáng mát', 400000.00, 30, '', '2026-06-13 11:16:21'),
(37, 3, 'Set Bộ Áo 2 Dây Form Rộng', 'Nữ', 'Su Gân', 'Form rộng thoải mái', 430000.00, 28, '', '2026-06-13 11:16:21'),
(38, 3, 'Set Bộ Áo 2 Dây Vintage', 'Nữ', 'Cotton', 'Phong cách vintage', 460000.00, 20, '', '2026-06-13 11:16:21'),
(39, 3, 'Set Bộ Áo 2 Dây Thời Trang', 'Nữ', 'Cotton', 'Xu hướng thời trang mới', 450000.00, 25, '', '2026-06-13 11:16:21'),
(40, 3, 'Set Bộ Áo 2 Dây Dài', 'Nữ', 'Su Gân', 'Kiểu dáng dài', 470000.00, 18, '', '2026-06-13 11:16:21'),
(41, 3, 'Set Bộ Áo 2 Dây Premium', 'Nữ', 'Cotton', 'Phiên bản premium', 550000.00, 12, '', '2026-06-13 11:16:21'),
(42, 1, 'Áo Khoác Chống Nắng Có Nón', 'Nữ', 'Tổng Hợp', 'Có nón chống nắng', 320000.00, 50, '', '2026-06-13 11:16:21'),
(43, 1, 'Áo Khoác Chống Nắng Không Nón', 'Nữ', 'Tổng Hợp', 'Thiết kế không nón', 300000.00, 55, '', '2026-06-13 11:16:21'),
(44, 1, 'Áo Khoác Chống Nắng Nam Có Nón', 'Nam', 'Tổng Hợp', 'Chống nắng cho nam', 340000.00, 40, '', '2026-06-13 11:16:21'),
(45, 1, 'Áo Khoác Chống Nắng Nam Không Nón', 'Nam', 'Tổng Hợp', 'Mỏng nhẹ thoáng khí', 330000.00, 45, '', '2026-06-13 11:16:21'),
(46, 1, 'Áo Khoác Su Gân Nam', 'Nam', 'Su Gân', 'Su gân co giãn tốt', 390000.00, 30, '', '2026-06-13 11:16:21'),
(47, 1, 'Áo Khoác Su Gân Nữ', 'Nữ', 'Su Gân', 'Thiết kế nữ tính', 380000.00, 35, '', '2026-06-13 11:16:21'),
(48, 1, 'Áo Khoác Nỉ Cotton Premium Nam', 'Nam', 'Nỉ Cotton', 'Nỉ cotton cao cấp', 480000.00, 20, '', '2026-06-13 11:16:21'),
(49, 1, 'Áo Khoác Nỉ Cotton Premium Nữ', 'Nữ', 'Nỉ Cotton', 'Mềm mại thoải mái', 470000.00, 22, '', '2026-06-13 11:16:21'),
(50, 2, 'Set Bộ Cổ Vuông Luxury', 'Nữ', 'Cotton', 'Phiên bản luxury', 620000.00, 10, '', '2026-06-13 11:16:21'),
(51, 3, 'Set Bộ Áo 2 Dây Luxury', 'Nữ', 'Cotton', 'Dòng sản phẩm luxury', 650000.00, 8, '', '2026-06-13 11:16:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
