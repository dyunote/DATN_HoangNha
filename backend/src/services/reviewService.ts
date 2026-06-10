import { RowDataPacket } from 'mysql2';
import * as reviewModel from '../models/reviewModel';
import * as productModel from '../models/productModel';
import pool from '../config/db';
import { AppError } from '../utils/response';
import { UserRow } from '../types';

export const listForProduct = (productId: number) => reviewModel.findByProduct(productId);

interface CreateReviewInput {
  product_id: number;
  rating: number;
  comment?: string | null;
  image_url?: string | null;
}

interface OrderDetailIdRow extends RowDataPacket {
  id: number;
}

export const create = async (user: UserRow, { product_id, rating, comment, image_url }: CreateReviewInput) => {
  if (!product_id || !rating) {
    throw new AppError('Vui long chon san pham va so sao danh gia', 400);
  }
  if (rating < 1 || rating > 5) {
    throw new AppError('So sao danh gia phai tu 1 den 5', 400);
  }

  const product = await productModel.findById(product_id);
  if (!product) throw new AppError('Khong tim thay san pham', 404);

  // Chi cho phep danh gia san pham da tung mua
  const [rows] = await pool.query<OrderDetailIdRow[]>(
    `SELECT od.id FROM order_details od
     JOIN orders o ON o.id = od.order_id
     JOIN product_variants pv ON pv.id = od.variant_id
     WHERE o.user_id = ? AND pv.product_id = ? AND o.status = 'delivered'
     LIMIT 1`,
    [user.id, product_id]
  );
  if (rows.length === 0) {
    throw new AppError('Ban can mua va nhan san pham nay truoc khi danh gia', 400);
  }

  const id = await reviewModel.create({ user_id: user.id, product_id, rating, comment, image_url });
  const reviews = await reviewModel.findByProduct(product_id);
  return reviews.find((r) => r.id === id);
};
