import { ResultSetHeader } from 'mysql2';
import pool from '../config/db';
import { UserRow } from '../types';

export const findById = async (id: number) => {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

export const findByEmail = async (email: string) => {
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

interface CreateUserInput {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  address?: string | null;
}

export const create = async ({ full_name, email, password, phone, address }: CreateUserInput) => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)',
    [full_name, email, password, phone || null, address || null]
  );
  return result.insertId;
};

interface UpdateProfileInput {
  full_name: string;
  phone?: string | null;
  address?: string | null;
}

export const updateProfile = async (id: number, { full_name, phone, address }: UpdateProfileInput) => {
  await pool.query('UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?', [
    full_name,
    phone || null,
    address || null,
    id,
  ]);
};

export const updatePassword = async (id: number, hashedPassword: string) => {
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
};

export const findAll = async () => {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, full_name, email, phone, address, role, member_level, is_locked, created_at FROM users ORDER BY id DESC'
  );
  return rows;
};

export const setLocked = async (id: number, isLocked: boolean) => {
  await pool.query('UPDATE users SET is_locked = ? WHERE id = ?', [isLocked ? 1 : 0, id]);
};
