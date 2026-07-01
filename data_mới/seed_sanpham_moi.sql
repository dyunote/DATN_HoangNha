-- ============================================================
-- HOANG NHA - DATA SAN PHAM MOI (50 san pham)
-- Khop schema hien tai: products + product_images + product_variants
-- Anh: loremflickr (anh that theo tu khoa loai san pham), co ?lock de co dinh
-- An toan: them moi, KHONG dung toi du lieu cu. ID san pham tu tang.
-- ============================================================

-- YEU CAU: da chay schema.sql (tao DB hoangnha + cac bang) truoc khi chay file nay.
-- XAMPP/phpMyAdmin: chon DB hoangnha > tab Import > chon file nay.

USE hoangnha;
SET NAMES utf8mb4;

START TRANSACTION;

-- [01] (Combo áo khoác không nón xanh than + xanh kẻ sọc) Nữ chống nắng khóa kéo
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, '(Combo áo khoác không nón xanh than + xanh kẻ sọc) Nữ chống nắng khóa kéo', '(Combo áo khoác không nón xanh than + xanh kẻ sọc) Nữ chống nắng khóa kéo - hang chinh hang, chat lieu cao cap.', 350000, 0, 168, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=1', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=101', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 9),
(@pid, 'L', 'Đen', 9),
(@pid, 'XL', 'Đen', 8),
(@pid, 'M', 'Xanh rêu', 8),
(@pid, 'L', 'Xanh rêu', 8),
(@pid, 'XL', 'Xanh rêu', 8);

-- [02] Áo khoác 6 túi xanh ngọc phối viền bản, nữ chống nắng nỉ khóa kéo (2 trong, 2 túi ngoài)
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác 6 túi xanh ngọc phối viền bản, nữ chống nắng nỉ khóa kéo (2 trong, 2 túi ngoài)', 'Áo khoác 6 túi xanh ngọc phối viền bản, nữ chống nắng nỉ khóa kéo (2 trong, 2 túi ngoài) - hang chinh hang, chat lieu cao cap.', 370000, 0, 33, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=2', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=102', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 7),
(@pid, 'L', 'Đen', 7),
(@pid, 'XL', 'Đen', 7),
(@pid, 'M', 'Xanh rêu', 7),
(@pid, 'L', 'Xanh rêu', 6),
(@pid, 'XL', 'Xanh rêu', 6);

-- [03] Áo khoác 6 túi xanh đen viền bản phối, nữ chống nắng nỉ khóa kéo
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác 6 túi xanh đen viền bản phối, nữ chống nắng nỉ khóa kéo', 'Áo khoác 6 túi xanh đen viền bản phối, nữ chống nắng nỉ khóa kéo - hang chinh hang, chat lieu cao cap.', 390000, 1, 11, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=3', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=103', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 6),
(@pid, 'L', 'Đen', 6),
(@pid, 'XL', 'Đen', 6),
(@pid, 'M', 'Xanh rêu', 6),
(@pid, 'L', 'Xanh rêu', 6),
(@pid, 'XL', 'Xanh rêu', 5);

-- [04] Áo khoác 6 túi xanh trà, nữ chống nắng nỉ khóa kéo
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác 6 túi xanh trà, nữ chống nắng nỉ khóa kéo', 'Áo khoác 6 túi xanh trà, nữ chống nắng nỉ khóa kéo - hang chinh hang, chat lieu cao cap.', 340000, 0, 75, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=4', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=104', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 8),
(@pid, 'L', 'Đen', 8),
(@pid, 'XL', 'Đen', 8),
(@pid, 'M', 'Xanh rêu', 7),
(@pid, 'L', 'Xanh rêu', 7),
(@pid, 'XL', 'Xanh rêu', 7);

-- [05] Áo khoác gân đũa có nón hàng 4 túi
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác gân đũa có nón hàng 4 túi', 'Áo khoác gân đũa có nón hàng 4 túi - hang chinh hang, chat lieu cao cap.', 420000, 0, 67, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=5', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=105', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 5),
(@pid, 'XL', 'Đen', 5),
(@pid, 'M', 'Xanh rêu', 5),
(@pid, 'L', 'Xanh rêu', 5),
(@pid, 'XL', 'Xanh rêu', 5);

-- [06] Áo khoác nữ lót lụa phong cách thể thao cá tính phối viền
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác nữ lót lụa phong cách thể thao cá tính phối viền', 'Áo khoác nữ lót lụa phong cách thể thao cá tính phối viền - hang chinh hang, chat lieu cao cap.', 450000, 1, 62, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=6', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=106', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 4),
(@pid, 'XL', 'Đen', 4),
(@pid, 'M', 'Xanh rêu', 4),
(@pid, 'L', 'Xanh rêu', 4),
(@pid, 'XL', 'Xanh rêu', 4);

-- [07] (Combo 2 áo khoác nỉ 6 túi đỏ rượu + đen) Nữ chống nắng khóa kéo
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, '(Combo 2 áo khoác nỉ 6 túi đỏ rượu + đen) Nữ chống nắng khóa kéo', '(Combo 2 áo khoác nỉ 6 túi đỏ rượu + đen) Nữ chống nắng khóa kéo - hang chinh hang, chat lieu cao cap.', 550000, 0, 40, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=7', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=107', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 4),
(@pid, 'L', 'Đen', 4),
(@pid, 'XL', 'Đen', 3),
(@pid, 'M', 'Xanh rêu', 3),
(@pid, 'L', 'Xanh rêu', 3),
(@pid, 'XL', 'Xanh rêu', 3);

-- [08] (Combo 2 áo khoác gân 6 túi nâu tây + đen) Nữ chống nắng khóa kéo
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, '(Combo 2 áo khoác gân 6 túi nâu tây + đen) Nữ chống nắng khóa kéo', '(Combo 2 áo khoác gân 6 túi nâu tây + đen) Nữ chống nắng khóa kéo - hang chinh hang, chat lieu cao cap.', 320000, 0, 31, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=8', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=108', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 10),
(@pid, 'L', 'Đen', 10),
(@pid, 'XL', 'Đen', 10),
(@pid, 'M', 'Xanh rêu', 10),
(@pid, 'L', 'Xanh rêu', 10),
(@pid, 'XL', 'Xanh rêu', 10);

-- [09] (Combo 2 áo khoác POLY su viền đen + xanh rêu thêu chữ không nón) có xỏ ngón tay
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, '(Combo 2 áo khoác POLY su viền đen + xanh rêu thêu chữ không nón) có xỏ ngón tay', '(Combo 2 áo khoác POLY su viền đen + xanh rêu thêu chữ không nón) có xỏ ngón tay - hang chinh hang, chat lieu cao cap.', 400000, 1, 178, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=9', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=109', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 5),
(@pid, 'XL', 'Đen', 5),
(@pid, 'M', 'Xanh rêu', 5),
(@pid, 'L', 'Xanh rêu', 5),
(@pid, 'XL', 'Xanh rêu', 5);

-- [10] Áo khoác su loại 1 (không nón) form ôm tập gym, yoga chất liệu su ôm body có xỏ ngón
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác su loại 1 (không nón) form ôm tập gym, yoga chất liệu su ôm body có xỏ ngón', 'Áo khoác su loại 1 (không nón) form ôm tập gym, yoga chất liệu su ôm body có xỏ ngón - hang chinh hang, chat lieu cao cap.', 380000, 0, 144, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=10', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=110', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 7),
(@pid, 'L', 'Đen', 7),
(@pid, 'XL', 'Đen', 7),
(@pid, 'M', 'Xanh rêu', 7),
(@pid, 'L', 'Xanh rêu', 6),
(@pid, 'XL', 'Xanh rêu', 6);

-- [11] Áo khoác thun umi chạy viền
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác thun umi chạy viền', 'Áo khoác thun umi chạy viền - hang chinh hang, chat lieu cao cap.', 340000, 0, 27, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=11', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=111', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 10),
(@pid, 'L', 'Đen', 9),
(@pid, 'XL', 'Đen', 9),
(@pid, 'M', 'Xanh rêu', 9),
(@pid, 'L', 'Xanh rêu', 9),
(@pid, 'XL', 'Xanh rêu', 9);

-- [12] Áo thun nam nữ phối họa tiết viền vai form chuẩn cotton dày dặn co giãn nhẹ hot trend
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo thun nam nữ phối họa tiết viền vai form chuẩn cotton dày dặn co giãn nhẹ hot trend', 'Áo thun nam nữ phối họa tiết viền vai form chuẩn cotton dày dặn co giãn nhẹ hot trend - hang chinh hang, chat lieu cao cap.', 360000, 1, 156, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/tshirt,fashion?lock=12', 1),
(@pid, 'https://loremflickr.com/600/800/tshirt,fashion?lock=112', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 8),
(@pid, 'M', 'Trắng', 8),
(@pid, 'L', 'Trắng', 8),
(@pid, 'S', 'Đen', 7),
(@pid, 'M', 'Đen', 7),
(@pid, 'L', 'Đen', 7);

-- [13] Combo 3 quần đùi ngẫu nhiên ống rộng chất tuyết mưa
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(2, 'Combo 3 quần đùi ngẫu nhiên ống rộng chất tuyết mưa', 'Combo 3 quần đùi ngẫu nhiên ống rộng chất tuyết mưa - hang chinh hang, chat lieu cao cap.', 390000, 0, 113, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/shorts,menswear?lock=13', 1),
(@pid, 'https://loremflickr.com/600/800/shorts,menswear?lock=113', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 9),
(@pid, 'L', 'Đen', 9),
(@pid, 'M', 'Xám', 9),
(@pid, 'L', 'Xám', 8);

-- [14] Áo khoác nam 4 túi, PC nam chống nắng, không nón + khóa kéo (2 túi ngoài, 2 túi trong)
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác nam 4 túi, PC nam chống nắng, không nón + khóa kéo (2 túi ngoài, 2 túi trong)', 'Áo khoác nam 4 túi, PC nam chống nắng, không nón + khóa kéo (2 túi ngoài, 2 túi trong) - hang chinh hang, chat lieu cao cap.', 350000, 0, 13, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=14', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=114', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 7),
(@pid, 'L', 'Đen', 7),
(@pid, 'XL', 'Đen', 7),
(@pid, 'M', 'Xanh rêu', 7),
(@pid, 'L', 'Xanh rêu', 6),
(@pid, 'XL', 'Xanh rêu', 6);

-- [15] Áo khoác nỉ cổ cao tay phối viền 3 màu cầu vồng Basic (có túi trong tay xỏ ngón chống nắng)
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác nỉ cổ cao tay phối viền 3 màu cầu vồng Basic (có túi trong tay xỏ ngón chống nắng)', 'Áo khoác nỉ cổ cao tay phối viền 3 màu cầu vồng Basic (có túi trong tay xỏ ngón chống nắng) - hang chinh hang, chat lieu cao cap.', 290000, 1, 12, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=15', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=115', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 12),
(@pid, 'L', 'Đen', 12),
(@pid, 'XL', 'Đen', 12),
(@pid, 'M', 'Xanh rêu', 12),
(@pid, 'L', 'Xanh rêu', 11),
(@pid, 'XL', 'Xanh rêu', 11);

-- [16] Combo 2 quần đùi đen nam
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(2, 'Combo 2 quần đùi đen nam', 'Combo 2 quần đùi đen nam - hang chinh hang, chat lieu cao cap.', 350000, 0, 28, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/shorts,menswear?lock=16', 1),
(@pid, 'https://loremflickr.com/600/800/shorts,menswear?lock=116', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 13),
(@pid, 'L', 'Đen', 13),
(@pid, 'M', 'Xám', 12),
(@pid, 'L', 'Xám', 12);

-- [17] Áo lẻ cổ lọ tay dài phong cách Hàn Quốc
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo lẻ cổ lọ tay dài phong cách Hàn Quốc', 'Áo lẻ cổ lọ tay dài phong cách Hàn Quốc - hang chinh hang, chat lieu cao cap.', 420000, 0, 60, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/tshirt,fashion?lock=17', 1),
(@pid, 'https://loremflickr.com/600/800/tshirt,fashion?lock=117', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 5),
(@pid, 'M', 'Trắng', 5),
(@pid, 'L', 'Trắng', 5),
(@pid, 'S', 'Đen', 5),
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 5);

-- [18] Bộ 2 dây chất liệu cotton cực mát co giãn 4 chiều thấm hút mồ hôi
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Bộ 2 dây chất liệu cotton cực mát co giãn 4 chiều thấm hút mồ hôi', 'Bộ 2 dây chất liệu cotton cực mát co giãn 4 chiều thấm hút mồ hôi - hang chinh hang, chat lieu cao cap.', 380000, 1, 64, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=18', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=118', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 5),
(@pid, 'M', 'Trắng', 4),
(@pid, 'L', 'Trắng', 4),
(@pid, 'S', 'Đen', 4),
(@pid, 'M', 'Đen', 4),
(@pid, 'L', 'Đen', 4);

-- [19] Áo khoác 4 túi, nữ chống nắng nỉ có nón khóa kéo (2 trong, 2 túi ngoài)
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác 4 túi, nữ chống nắng nỉ có nón khóa kéo (2 trong, 2 túi ngoài)', 'Áo khoác 4 túi, nữ chống nắng nỉ có nón khóa kéo (2 trong, 2 túi ngoài) - hang chinh hang, chat lieu cao cap.', 400000, 0, 134, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=19', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=119', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 6),
(@pid, 'L', 'Đen', 6),
(@pid, 'XL', 'Đen', 6),
(@pid, 'M', 'Xanh rêu', 6),
(@pid, 'L', 'Xanh rêu', 6),
(@pid, 'XL', 'Xanh rêu', 5);

-- [20] Khoác 4 túi POLY form thể thao (không nón) + chống nắng
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Khoác 4 túi POLY form thể thao (không nón) + chống nắng', 'Khoác 4 túi POLY form thể thao (không nón) + chống nắng - hang chinh hang, chat lieu cao cap.', 390000, 0, 159, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=20', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=120', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 5),
(@pid, 'XL', 'Đen', 5),
(@pid, 'M', 'Xanh rêu', 5),
(@pid, 'L', 'Xanh rêu', 5),
(@pid, 'XL', 'Xanh rêu', 5);

-- [21] (Áo lẻ) xốp nhung size 40-65kg
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, '(Áo lẻ) xốp nhung size 40-65kg', '(Áo lẻ) xốp nhung size 40-65kg - hang chinh hang, chat lieu cao cap.', 450000, 1, 11, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/tshirt,fashion?lock=21', 1),
(@pid, 'https://loremflickr.com/600/800/tshirt,fashion?lock=121', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 5),
(@pid, 'M', 'Trắng', 5),
(@pid, 'L', 'Trắng', 5),
(@pid, 'S', 'Đen', 5),
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 5);

-- [22] Combo 2 áo khoác nỉ 6 túi xanh rêu đậm + đen
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Combo 2 áo khoác nỉ 6 túi xanh rêu đậm + đen', 'Combo 2 áo khoác nỉ 6 túi xanh rêu đậm + đen - hang chinh hang, chat lieu cao cap.', 470000, 0, 148, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=22', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=122', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 4),
(@pid, 'XL', 'Đen', 4),
(@pid, 'M', 'Xanh rêu', 4),
(@pid, 'L', 'Xanh rêu', 4),
(@pid, 'XL', 'Xanh rêu', 4);

-- [23] Set bộ cổ vuông Vintage
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ cổ vuông Vintage', 'Set bộ cổ vuông Vintage - hang chinh hang, chat lieu cao cap.', 490000, 0, 55, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=23', 1),
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=123', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 4),
(@pid, 'M', 'Trắng', 4),
(@pid, 'L', 'Trắng', 3),
(@pid, 'S', 'Đen', 3),
(@pid, 'M', 'Đen', 3),
(@pid, 'L', 'Đen', 3);

-- [24] Set bộ cổ vuông cao cấp
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ cổ vuông cao cấp', 'Set bộ cổ vuông cao cấp - hang chinh hang, chat lieu cao cap.', 550000, 1, 171, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=24', 1),
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=124', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 3),
(@pid, 'M', 'Trắng', 3),
(@pid, 'L', 'Trắng', 3),
(@pid, 'S', 'Đen', 2),
(@pid, 'M', 'Đen', 2),
(@pid, 'L', 'Đen', 2);

-- [25] Set bộ cổ vuông công sở
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ cổ vuông công sở', 'Set bộ cổ vuông công sở - hang chinh hang, chat lieu cao cap.', 520000, 0, 144, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=25', 1),
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=125', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 3),
(@pid, 'M', 'Trắng', 3),
(@pid, 'L', 'Trắng', 3),
(@pid, 'S', 'Đen', 3),
(@pid, 'M', 'Đen', 3),
(@pid, 'L', 'Đen', 3);

-- [26] Set bộ cổ vuông Hàn Quốc
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ cổ vuông Hàn Quốc', 'Set bộ cổ vuông Hàn Quốc - hang chinh hang, chat lieu cao cap.', 500000, 0, 112, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=26', 1),
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=126', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 4),
(@pid, 'M', 'Trắng', 4),
(@pid, 'L', 'Trắng', 3),
(@pid, 'S', 'Đen', 3),
(@pid, 'M', 'Đen', 3),
(@pid, 'L', 'Đen', 3);

-- [27] Set bộ ống suông Basic
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ ống suông Basic', 'Set bộ ống suông Basic - hang chinh hang, chat lieu cao cap.', 460000, 1, 61, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=27', 1),
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=127', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 5),
(@pid, 'M', 'Trắng', 4),
(@pid, 'L', 'Trắng', 4),
(@pid, 'S', 'Đen', 4),
(@pid, 'M', 'Đen', 4),
(@pid, 'L', 'Đen', 4);

-- [28] Set bộ ống suông dài
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ ống suông dài', 'Set bộ ống suông dài - hang chinh hang, chat lieu cao cap.', 480000, 0, 119, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=28', 1),
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=128', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 4),
(@pid, 'M', 'Trắng', 4),
(@pid, 'L', 'Trắng', 4),
(@pid, 'S', 'Đen', 4),
(@pid, 'M', 'Đen', 3),
(@pid, 'L', 'Đen', 3);

-- [29] Set bộ dự tiệc
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ dự tiệc', 'Set bộ dự tiệc - hang chinh hang, chat lieu cao cap.', 590000, 0, 155, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=29', 1),
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=129', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 2),
(@pid, 'M', 'Trắng', 2),
(@pid, 'L', 'Trắng', 2),
(@pid, 'S', 'Đen', 2),
(@pid, 'M', 'Đen', 2),
(@pid, 'L', 'Đen', 2);

-- [30] Set bộ form rộng
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ form rộng', 'Set bộ form rộng - hang chinh hang, chat lieu cao cap.', 510000, 1, 76, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=30', 1),
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=130', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 4),
(@pid, 'M', 'Trắng', 4),
(@pid, 'L', 'Trắng', 3),
(@pid, 'S', 'Đen', 3),
(@pid, 'M', 'Đen', 3),
(@pid, 'L', 'Đen', 3);

-- [31] Set bộ áo 2 dây Basic
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây Basic', 'Set bộ áo 2 dây Basic - hang chinh hang, chat lieu cao cap.', 390000, 0, 6, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=31', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=131', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 6),
(@pid, 'M', 'Trắng', 6),
(@pid, 'L', 'Trắng', 6),
(@pid, 'S', 'Đen', 6),
(@pid, 'M', 'Đen', 6),
(@pid, 'L', 'Đen', 5);

-- [32] Set bộ áo 2 dây Hàn Quốc
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây Hàn Quốc', 'Set bộ áo 2 dây Hàn Quốc - hang chinh hang, chat lieu cao cap.', 420000, 0, 45, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=32', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=132', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 5),
(@pid, 'M', 'Trắng', 5),
(@pid, 'L', 'Trắng', 5),
(@pid, 'S', 'Đen', 5),
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 5);

-- [33] Set bộ áo 2 dây dạo phố
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây dạo phố', 'Set bộ áo 2 dây dạo phố - hang chinh hang, chat lieu cao cap.', 450000, 1, 113, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=33', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=133', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 5),
(@pid, 'M', 'Trắng', 4),
(@pid, 'L', 'Trắng', 4),
(@pid, 'S', 'Đen', 4),
(@pid, 'M', 'Đen', 4),
(@pid, 'L', 'Đen', 4);

-- [34] Set bộ áo 2 dây cao cấp
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây cao cấp', 'Set bộ áo 2 dây cao cấp - hang chinh hang, chat lieu cao cap.', 520000, 0, 92, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=34', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=134', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 3),
(@pid, 'M', 'Trắng', 3),
(@pid, 'L', 'Trắng', 3),
(@pid, 'S', 'Đen', 2),
(@pid, 'M', 'Đen', 2),
(@pid, 'L', 'Đen', 2);

-- [35] Set bộ áo 2 dây mùa hè
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây mùa hè', 'Set bộ áo 2 dây mùa hè - hang chinh hang, chat lieu cao cap.', 400000, 0, 76, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=35', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=135', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 5),
(@pid, 'M', 'Trắng', 5),
(@pid, 'L', 'Trắng', 5),
(@pid, 'S', 'Đen', 5),
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 5);

-- [36] Set bộ áo 2 dây form rộng
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây form rộng', 'Set bộ áo 2 dây form rộng - hang chinh hang, chat lieu cao cap.', 430000, 1, 44, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=36', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=136', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 5),
(@pid, 'M', 'Trắng', 5),
(@pid, 'L', 'Trắng', 5),
(@pid, 'S', 'Đen', 5),
(@pid, 'M', 'Đen', 4),
(@pid, 'L', 'Đen', 4);

-- [37] Set bộ áo 2 dây Vintage
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây Vintage', 'Set bộ áo 2 dây Vintage - hang chinh hang, chat lieu cao cap.', 460000, 0, 60, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=37', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=137', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 4),
(@pid, 'M', 'Trắng', 4),
(@pid, 'L', 'Trắng', 3),
(@pid, 'S', 'Đen', 3),
(@pid, 'M', 'Đen', 3),
(@pid, 'L', 'Đen', 3);

-- [38] Set bộ áo 2 dây thời trang
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây thời trang', 'Set bộ áo 2 dây thời trang - hang chinh hang, chat lieu cao cap.', 450000, 0, 91, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=38', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=138', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 5),
(@pid, 'M', 'Trắng', 4),
(@pid, 'L', 'Trắng', 4),
(@pid, 'S', 'Đen', 4),
(@pid, 'M', 'Đen', 4),
(@pid, 'L', 'Đen', 4);

-- [39] Set bộ áo 2 dây dài
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây dài', 'Set bộ áo 2 dây dài - hang chinh hang, chat lieu cao cap.', 470000, 1, 31, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=39', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=139', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 3),
(@pid, 'M', 'Trắng', 3),
(@pid, 'L', 'Trắng', 3),
(@pid, 'S', 'Đen', 3),
(@pid, 'M', 'Đen', 3),
(@pid, 'L', 'Đen', 3);

-- [40] Set bộ áo 2 dây Premium
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây Premium', 'Set bộ áo 2 dây Premium - hang chinh hang, chat lieu cao cap.', 550000, 0, 28, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=40', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=140', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 2),
(@pid, 'M', 'Trắng', 2),
(@pid, 'L', 'Trắng', 2),
(@pid, 'S', 'Đen', 2),
(@pid, 'M', 'Đen', 2),
(@pid, 'L', 'Đen', 2);

-- [41] Áo khoác chống nắng có nón
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác chống nắng có nón', 'Áo khoác chống nắng có nón - hang chinh hang, chat lieu cao cap.', 320000, 0, 102, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=41', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=141', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 9),
(@pid, 'L', 'Đen', 9),
(@pid, 'XL', 'Đen', 8),
(@pid, 'M', 'Xanh rêu', 8),
(@pid, 'L', 'Xanh rêu', 8),
(@pid, 'XL', 'Xanh rêu', 8);

-- [42] Áo khoác chống nắng không nón
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác chống nắng không nón', 'Áo khoác chống nắng không nón - hang chinh hang, chat lieu cao cap.', 300000, 1, 29, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=42', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=142', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 10),
(@pid, 'L', 'Đen', 9),
(@pid, 'XL', 'Đen', 9),
(@pid, 'M', 'Xanh rêu', 9),
(@pid, 'L', 'Xanh rêu', 9),
(@pid, 'XL', 'Xanh rêu', 9);

-- [43] Áo khoác chống nắng nam có nón
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác chống nắng nam có nón', 'Áo khoác chống nắng nam có nón - hang chinh hang, chat lieu cao cap.', 340000, 0, 96, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=43', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=143', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 7),
(@pid, 'L', 'Đen', 7),
(@pid, 'XL', 'Đen', 7),
(@pid, 'M', 'Xanh rêu', 7),
(@pid, 'L', 'Xanh rêu', 6),
(@pid, 'XL', 'Xanh rêu', 6);

-- [44] Áo khoác chống nắng nam không nón
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác chống nắng nam không nón', 'Áo khoác chống nắng nam không nón - hang chinh hang, chat lieu cao cap.', 330000, 0, 93, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=44', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=144', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 8),
(@pid, 'L', 'Đen', 8),
(@pid, 'XL', 'Đen', 8),
(@pid, 'M', 'Xanh rêu', 7),
(@pid, 'L', 'Xanh rêu', 7),
(@pid, 'XL', 'Xanh rêu', 7);

-- [45] Áo khoác su gân nam
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác su gân nam', 'Áo khoác su gân nam - hang chinh hang, chat lieu cao cap.', 390000, 1, 159, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=45', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=145', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 5),
(@pid, 'L', 'Đen', 5),
(@pid, 'XL', 'Đen', 5),
(@pid, 'M', 'Xanh rêu', 5),
(@pid, 'L', 'Xanh rêu', 5),
(@pid, 'XL', 'Xanh rêu', 5);

-- [46] Áo khoác su gân nữ
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác su gân nữ', 'Áo khoác su gân nữ - hang chinh hang, chat lieu cao cap.', 380000, 0, 72, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=46', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=146', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 6),
(@pid, 'L', 'Đen', 6),
(@pid, 'XL', 'Đen', 6),
(@pid, 'M', 'Xanh rêu', 6),
(@pid, 'L', 'Xanh rêu', 6),
(@pid, 'XL', 'Xanh rêu', 5);

-- [47] Áo khoác nỉ cotton Premium nam
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác nỉ cotton Premium nam', 'Áo khoác nỉ cotton Premium nam - hang chinh hang, chat lieu cao cap.', 480000, 0, 16, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=47', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=147', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 4),
(@pid, 'L', 'Đen', 4),
(@pid, 'XL', 'Đen', 3),
(@pid, 'M', 'Xanh rêu', 3),
(@pid, 'L', 'Xanh rêu', 3),
(@pid, 'XL', 'Xanh rêu', 3);

-- [48] Áo khoác nỉ cotton Premium nữ
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(1, 'Áo khoác nỉ cotton Premium nữ', 'Áo khoác nỉ cotton Premium nữ - hang chinh hang, chat lieu cao cap.', 470000, 1, 122, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=48', 1),
(@pid, 'https://loremflickr.com/600/800/jacket,coat?lock=148', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'M', 'Đen', 4),
(@pid, 'L', 'Đen', 4),
(@pid, 'XL', 'Đen', 4),
(@pid, 'M', 'Xanh rêu', 4),
(@pid, 'L', 'Xanh rêu', 3),
(@pid, 'XL', 'Xanh rêu', 3);

-- [49] Set bộ cổ vuông Luxury
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ cổ vuông Luxury', 'Set bộ cổ vuông Luxury - hang chinh hang, chat lieu cao cap.', 620000, 0, 142, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=49', 1),
(@pid, 'https://loremflickr.com/600/800/dress,outfit?lock=149', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 2),
(@pid, 'M', 'Trắng', 2),
(@pid, 'L', 'Trắng', 2),
(@pid, 'S', 'Đen', 2),
(@pid, 'M', 'Đen', 1),
(@pid, 'L', 'Đen', 1);

-- [50] Set bộ áo 2 dây Luxury
INSERT INTO products (category_id, name, description, price, is_new, sold_count, is_hidden) VALUES
(3, 'Set bộ áo 2 dây Luxury', 'Set bộ áo 2 dây Luxury - hang chinh hang, chat lieu cao cap.', 650000, 0, 36, 0);
SET @pid = LAST_INSERT_ID();
INSERT INTO product_images (product_id, image_url, is_main) VALUES
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=50', 1),
(@pid, 'https://loremflickr.com/600/800/dress,summer?lock=150', 0);
INSERT INTO product_variants (product_id, size, color, stock) VALUES
(@pid, 'S', 'Trắng', 2),
(@pid, 'M', 'Trắng', 2),
(@pid, 'L', 'Trắng', 1),
(@pid, 'S', 'Đen', 1),
(@pid, 'M', 'Đen', 1),
(@pid, 'L', 'Đen', 1);

COMMIT;
