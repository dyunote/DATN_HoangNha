import * as cartModel from '../models/cartModel';
import * as productModel from '../models/productModel';
import * as voucherModel from '../models/voucherModel';
import { AppError } from '../utils/response';
import { calcCartTotals } from '../utils/pricing';
import { UserRow } from '../types';

export const getCart = async (user: UserRow, voucherCode?: string) => {
  const cart = await cartModel.getOrCreateCart(user.id);
  const items = await cartModel.getItems(cart.id);

  let voucher = null;
  if (voucherCode) {
    voucher = await voucherModel.findByCode(voucherCode);
    if (!voucher) throw new AppError('Voucher khong ton tai', 404);
  }

  const totals = calcCartTotals(items, { memberLevel: user.member_level, voucher });

  return { cart_id: cart.id, items, voucher, ...totals };
};

interface AddItemInput {
  variant_id: number;
  quantity: number;
}

export const addItem = async (user: UserRow, { variant_id, quantity }: AddItemInput) => {
  if (!variant_id || !quantity || quantity <= 0) {
    throw new AppError('Vui long chon san pham va so luong hop le', 400);
  }

  const variant = await productModel.findVariantById(variant_id);
  if (!variant || variant.product_hidden) {
    throw new AppError('San pham khong ton tai', 404);
  }
  if (variant.stock < quantity) {
    throw new AppError('San pham khong du ton kho', 400);
  }

  const cart = await cartModel.getOrCreateCart(user.id);
  await cartModel.addItem(cart.id, variant_id, quantity);

  return getCart(user);
};

export const updateItem = async (user: UserRow, itemId: number, quantity: number) => {
  if (!quantity || quantity <= 0) {
    throw new AppError('So luong khong hop le', 400);
  }

  const cart = await cartModel.getOrCreateCart(user.id);
  await cartModel.updateItemQuantity(cart.id, itemId, quantity);

  return getCart(user);
};

export const removeItem = async (user: UserRow, itemId: number) => {
  const cart = await cartModel.getOrCreateCart(user.id);
  await cartModel.removeItem(cart.id, itemId);

  return getCart(user);
};
