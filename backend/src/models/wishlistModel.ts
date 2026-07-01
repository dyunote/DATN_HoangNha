import { ResultSetHeader } from 'mysql2';
import pool from '../config/db';
import { ProductRow, WishlistRow } from '../types';

// Kiem tra san pham da co trong wishlist cua user chua
export const exists = async (userId: number, productId: number) => {
  const [rows] = await pool.query<WishlistRow[]>(
    'SELECT * FROM wishlists WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return rows[0] || null;
};

// Them san pham vao wishlist (bo qua neu da co)
export const add = async (userId: number, productId: number) => {
  await pool.query<ResultSetHeader>(
    'INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)',
    [userId, productId]
  );
};

// Xoa khoi wishlist
export const remove = async (userId: number, productId: number) => {
  await pool.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId]);
};

// Danh sach san pham yeu thich cua user (kem so luot thich, anh chinh)
export const listByUser = async (userId: number) => {
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT p.*, c.name AS category_name,
      (SELECT COUNT(*) FROM wishlists w2 WHERE w2.product_id = p.id) AS like_count,
      (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC, pi.id ASC LIMIT 1) AS main_image
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE w.user_id = ? AND p.is_hidden = 0
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows;
};

// Lay tap product_id user da thich (de danh dau is_wished tren danh sach)
export const productIdsByUser = async (userId: number) => {
  const [rows] = await pool.query<WishlistRow[]>('SELECT product_id FROM wishlists WHERE user_id = ?', [userId]);
  return new Set(rows.map((r) => r.product_id));
};
