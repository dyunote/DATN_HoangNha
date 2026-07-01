import * as wishlistModel from '../models/wishlistModel';
import * as productModel from '../models/productModel';
import { AppError } from '../utils/response';
import { UserRow } from '../types';

// Danh sach yeu thich cua user
export const list = (userId: number) => wishlistModel.listByUser(userId);

// Them vao yeu thich
export const add = async (user: UserRow, productId: number) => {
  if (!productId) throw new AppError('Thieu ma san pham', 400);
  const product = await productModel.findById(productId);
  if (!product) throw new AppError('Khong tim thay san pham', 404);

  await wishlistModel.add(user.id, productId);
  return { product_id: productId, wished: true };
};

// Bo khoi yeu thich
export const remove = async (user: UserRow, productId: number) => {
  await wishlistModel.remove(user.id, productId);
  return { product_id: productId, wished: false };
};

// Bat/tat yeu thich (toggle) - tien cho nut trai tim
export const toggle = async (user: UserRow, productId: number) => {
  if (!productId) throw new AppError('Thieu ma san pham', 400);
  const existing = await wishlistModel.exists(user.id, productId);
  if (existing) {
    await wishlistModel.remove(user.id, productId);
    return { product_id: productId, wished: false };
  }
  const product = await productModel.findById(productId);
  if (!product) throw new AppError('Khong tim thay san pham', 404);
  await wishlistModel.add(user.id, productId);
  return { product_id: productId, wished: true };
};
