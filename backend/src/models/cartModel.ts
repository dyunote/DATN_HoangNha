import { PoolConnection } from 'mysql2/promise';
import pool from '../config/db';
import { CartItemRecordRow, CartItemRow } from '../types';

// Gio hang gop thang vao cart_items (moi dong gan voi user_id, khong co bang carts rieng)

export const getItems = async (userId: number) => {
  const [rows] = await pool.query<CartItemRow[]>(
    `SELECT ci.id AS cart_item_id, ci.quantity, ci.is_selected, pv.id AS variant_id, pv.size, pv.color, pv.stock,
            p.id AS product_id, p.name AS product_name, p.price,
            (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC, pi.id ASC LIMIT 1) AS image
     FROM cart_items ci
     JOIN product_variants pv ON pv.id = ci.variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE ci.user_id = ?
     ORDER BY ci.id ASC`,
    [userId]
  );
  return rows;
};

export const findItem = async (userId: number, variantId: number) => {
  const [rows] = await pool.query<CartItemRecordRow[]>('SELECT * FROM cart_items WHERE user_id = ? AND variant_id = ?', [
    userId,
    variantId,
  ]);
  return rows[0] || null;
};

export const addItem = async (userId: number, variantId: number, quantity: number) => {
  const existing = await findItem(userId, variantId);
  if (existing) {
    await pool.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing.id]);
  } else {
    await pool.query('INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)', [
      userId,
      variantId,
      quantity,
    ]);
  }
};

export const updateItemQuantity = async (userId: number, itemId: number, quantity: number) => {
  await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, itemId, userId]);
};

export const removeItem = async (userId: number, itemId: number) => {
  await pool.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [itemId, userId]);
};

export const clearCart = async (userId: number) => {
  await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
};

// Lay cac item da duoc tich chon (de thanh toan)
export const getSelectedItems = async (userId: number) => {
  const all = await getItems(userId);
  return all.filter((item) => Number(item.is_selected) === 1);
};

// Bat/tat tich chon mot item
export const setItemSelected = async (userId: number, itemId: number, selected: boolean) => {
  await pool.query('UPDATE cart_items SET is_selected = ? WHERE id = ? AND user_id = ?', [selected ? 1 : 0, itemId, userId]);
};

// Bat/tat tich chon tat ca item trong gio
export const setAllSelected = async (userId: number, selected: boolean) => {
  await pool.query('UPDATE cart_items SET is_selected = ? WHERE user_id = ?', [selected ? 1 : 0, userId]);
};

// Xoa cac item theo danh sach id (sau khi dat hang thanh cong)
export const removeItems = async (conn: PoolConnection, userId: number, itemIds: number[]) => {
  if (!itemIds.length) return;
  const placeholders = itemIds.map(() => '?').join(',');
  await conn.query(`DELETE FROM cart_items WHERE user_id = ? AND id IN (${placeholders})`, [userId, ...itemIds]);
};
