import { ResultSetHeader } from 'mysql2';
import pool from '../config/db';
import { CategoryRow } from '../types';

export const findAll = async ({ includeHidden = false } = {}) => {
  const sql = includeHidden
    ? 'SELECT * FROM categories ORDER BY id ASC'
    : 'SELECT * FROM categories WHERE is_hidden = 0 ORDER BY id ASC';
  const [rows] = await pool.query<CategoryRow[]>(sql);
  return rows;
};

export const findById = async (id: number) => {
  const [rows] = await pool.query<CategoryRow[]>('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
};

export const create = async ({ name }: { name: string }) => {
  const [result] = await pool.query<ResultSetHeader>('INSERT INTO categories (name) VALUES (?)', [name]);
  return result.insertId;
};

export const update = async (id: number, { name, is_hidden }: { name: string; is_hidden?: boolean | number }) => {
  await pool.query('UPDATE categories SET name = ?, is_hidden = ? WHERE id = ?', [name, is_hidden ? 1 : 0, id]);
};

export const setHidden = async (id: number, isHidden: boolean) => {
  await pool.query('UPDATE categories SET is_hidden = ? WHERE id = ?', [isHidden ? 1 : 0, id]);
};
