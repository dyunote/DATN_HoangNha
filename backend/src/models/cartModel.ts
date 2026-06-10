import { ResultSetHeader } from 'mysql2';
import pool from '../config/db';
import { CartItemRecordRow, CartItemRow, CartRow } from '../types';

// Lay hoac tao gio hang cua user
export const getOrCreateCart = async (userId: number) => {
  const [rows] = await pool.query<CartRow[]>('SELECT * FROM carts WHERE user_id = ?', [userId]);
  if (rows[0]) return rows[0];

  const [result] = await pool.query<ResultSetHeader>('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return { id: result.insertId, user_id: userId } as CartRow;
};

export const getItems = async (cartId: number) => {
  const [rows] = await pool.query<CartItemRow[]>(
    `SELECT ci.id AS cart_item_id, ci.quantity, pv.id AS variant_id, pv.size, pv.color, pv.stock,
            p.id AS product_id, p.name AS product_name, p.price,
            (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC, pi.id ASC LIMIT 1) AS image
     FROM cart_items ci
     JOIN product_variants pv ON pv.id = ci.variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.id ASC`,
    [cartId]
  );
  return rows;
};

export const findItem = async (cartId: number, variantId: number) => {
  const [rows] = await pool.query<CartItemRecordRow[]>('SELECT * FROM cart_items WHERE cart_id = ? AND variant_id = ?', [
    cartId,
    variantId,
  ]);
  return rows[0] || null;
};

export const addItem = async (cartId: number, variantId: number, quantity: number) => {
  const existing = await findItem(cartId, variantId);
  if (existing) {
    await pool.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing.id]);
  } else {
    await pool.query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)', [
      cartId,
      variantId,
      quantity,
    ]);
  }
};

export const updateItemQuantity = async (cartId: number, itemId: number, quantity: number) => {
  await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?', [quantity, itemId, cartId]);
};

export const removeItem = async (cartId: number, itemId: number) => {
  await pool.query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cartId]);
};

export const clearCart = async (cartId: number) => {
  await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
};
