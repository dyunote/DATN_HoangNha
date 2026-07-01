import { ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import pool from '../config/db';
import { DiscountType, VoucherRow } from '../types';

export const findAll = async () => {
  const [rows] = await pool.query<VoucherRow[]>('SELECT * FROM vouchers ORDER BY id DESC');
  return rows;
};

export const findByCode = async (code: string) => {
  const [rows] = await pool.query<VoucherRow[]>('SELECT * FROM vouchers WHERE code = ?', [code]);
  return rows[0] || null;
};

export const findById = async (id: number) => {
  const [rows] = await pool.query<VoucherRow[]>('SELECT * FROM vouchers WHERE id = ?', [id]);
  return rows[0] || null;
};

interface VoucherInput {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  start_date: string;
  end_date: string;
  quantity: number;
  is_active?: boolean | number;
}

export const create = async ({
  code,
  discount_type,
  discount_value,
  min_order_amount,
  start_date,
  end_date,
  quantity,
  is_active,
}: VoucherInput) => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO vouchers (code, discount_type, discount_value, min_order_amount, start_date, end_date, quantity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [code, discount_type, discount_value, min_order_amount || 0, start_date, end_date, quantity, is_active === undefined ? 1 : is_active ? 1 : 0]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  { code, discount_type, discount_value, min_order_amount, start_date, end_date, quantity, is_active }: VoucherInput
) => {
  await pool.query(
    'UPDATE vouchers SET code = ?, discount_type = ?, discount_value = ?, min_order_amount = ?, start_date = ?, end_date = ?, quantity = ?, is_active = ? WHERE id = ?',
    [code, discount_type, discount_value, min_order_amount || 0, start_date, end_date, quantity, is_active ? 1 : 0, id]
  );
};

export const decrementQuantity = async (conn: PoolConnection, id: number): Promise<boolean> => {
  const [res] = await conn.query<ResultSetHeader>(
    'UPDATE vouchers SET quantity = quantity - 1 WHERE id = ? AND quantity > 0',
    [id]
  );
  // affectedRows = 0 nghia la voucher da het luot -> bao cho caller rollback
  return res.affectedRows > 0;
};

// Hoan lai 1 luot voucher khi don bi huy
export const incrementQuantity = async (conn: PoolConnection, id: number) => {
  await conn.query('UPDATE vouchers SET quantity = quantity + 1 WHERE id = ?', [id]);
};

// ----- VOUCHER KHACH DA LUU -----

// Danh sach voucher dang hieu luc (con han, con luot, dang bat)
export const findActive = async () => {
  const [rows] = await pool.query<VoucherRow[]>(
    `SELECT * FROM vouchers
     WHERE is_active = 1 AND quantity > 0
       AND CURDATE() BETWEEN start_date AND end_date
     ORDER BY id DESC`
  );
  return rows;
};

// Luu voucher vao kho cua user (bo qua neu da luu)
export const saveForUser = async (userId: number, voucherId: number) => {
  await pool.query('INSERT IGNORE INTO user_vouchers (user_id, voucher_id) VALUES (?, ?)', [userId, voucherId]);
};

// Cac voucher user da luu
export const findSavedByUser = async (userId: number) => {
  const [rows] = await pool.query<VoucherRow[]>(
    `SELECT v.* FROM user_vouchers uv
     JOIN vouchers v ON v.id = uv.voucher_id
     WHERE uv.user_id = ?
     ORDER BY uv.created_at DESC`,
    [userId]
  );
  return rows;
};

// Tap id voucher user da luu (de danh dau "da luu")
export const savedVoucherIds = async (userId: number) => {
  const [rows] = await pool.query<VoucherRow[]>('SELECT voucher_id AS id FROM user_vouchers WHERE user_id = ?', [userId]);
  return new Set(rows.map((r) => r.id));
};
