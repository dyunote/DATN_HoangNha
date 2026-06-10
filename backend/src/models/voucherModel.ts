import { ResultSetHeader } from 'mysql2';
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
  start_date: string;
  end_date: string;
  quantity: number;
  is_active?: boolean | number;
}

export const create = async ({
  code,
  discount_type,
  discount_value,
  start_date,
  end_date,
  quantity,
  is_active,
}: VoucherInput) => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO vouchers (code, discount_type, discount_value, start_date, end_date, quantity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [code, discount_type, discount_value, start_date, end_date, quantity, is_active === undefined ? 1 : is_active ? 1 : 0]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  { code, discount_type, discount_value, start_date, end_date, quantity, is_active }: VoucherInput
) => {
  await pool.query(
    'UPDATE vouchers SET code = ?, discount_type = ?, discount_value = ?, start_date = ?, end_date = ?, quantity = ?, is_active = ? WHERE id = ?',
    [code, discount_type, discount_value, start_date, end_date, quantity, is_active ? 1 : 0, id]
  );
};

export const decrementQuantity = async (id: number) => {
  await pool.query('UPDATE vouchers SET quantity = quantity - 1 WHERE id = ? AND quantity > 0', [id]);
};
