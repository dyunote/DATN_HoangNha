import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/db';
import { ReviewRow } from '../types';

export const findByProduct = async (productId: number) => {
  const [rows] = await pool.query<ReviewRow[]>(
    `SELECT r.*, u.full_name AS user_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`,
    [productId]
  );
  return rows;
};

interface AverageRatingRow extends RowDataPacket {
  avg_rating: number | string;
  total: number;
}

export const getAverageRating = async (productId: number) => {
  const [[row]] = await pool.query<AverageRatingRow[]>(
    'SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total FROM reviews WHERE product_id = ?',
    [productId]
  );
  return { avg_rating: Number(row.avg_rating), total: row.total };
};

interface CreateReviewInput {
  user_id: number;
  product_id: number;
  rating: number;
  comment?: string | null;
  image_url?: string | null;
}

export const create = async ({ user_id, product_id, rating, comment, image_url }: CreateReviewInput) => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO reviews (user_id, product_id, rating, comment, image_url) VALUES (?, ?, ?, ?, ?)',
    [user_id, product_id, rating, comment || null, image_url || null]
  );
  return result.insertId;
};
