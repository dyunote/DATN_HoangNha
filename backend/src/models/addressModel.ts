import { ResultSetHeader } from 'mysql2';
import pool from '../config/db';
import { AddressRow } from '../types';

export const findByUser = async (userId: number) => {
  const [rows] = await pool.query<AddressRow[]>(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
    [userId]
  );
  return rows;
};

export const findById = async (id: number) => {
  const [rows] = await pool.query<AddressRow[]>('SELECT * FROM addresses WHERE id = ?', [id]);
  return rows[0] || null;
};

export const countByUser = async (userId: number) => {
  const [rows] = await pool.query<AddressRow[]>('SELECT id FROM addresses WHERE user_id = ?', [userId]);
  return rows.length;
};

interface AddressInput {
  receiver_name: string;
  phone: string;
  province: string;
  address: string;
}

// Bo het is_default cua user ve 0 - goi truoc khi dat 1 dia chi khac lam mac dinh
export const clearDefault = async (userId: number) => {
  await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
};

export const create = async (userId: number, data: AddressInput, isDefault: boolean) => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO addresses (user_id, receiver_name, phone, province, address, is_default) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, data.receiver_name, data.phone, data.province, data.address, isDefault ? 1 : 0]
  );
  return result.insertId;
};

export const update = async (id: number, data: AddressInput) => {
  await pool.query('UPDATE addresses SET receiver_name = ?, phone = ?, province = ?, address = ? WHERE id = ?', [
    data.receiver_name,
    data.phone,
    data.province,
    data.address,
    id,
  ]);
};

export const setDefaultFlag = async (id: number, isDefault: boolean) => {
  await pool.query('UPDATE addresses SET is_default = ? WHERE id = ?', [isDefault ? 1 : 0, id]);
};

export const remove = async (id: number) => {
  await pool.query('DELETE FROM addresses WHERE id = ?', [id]);
};
