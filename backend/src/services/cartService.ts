import * as cartModel from '../models/cartModel';
import * as productModel from '../models/productModel';
import * as voucherModel from '../models/voucherModel';
import { AppError } from '../utils/response';
import { calcCartTotals } from '../utils/pricing';
import { UserRow } from '../types';

export const getCart = async (user: UserRow, voucherCode?: string) => {
  const items = await cartModel.getItems(user.id);

  let voucher = null;
  if (voucherCode) {
    voucher = await voucherModel.findByCode(voucherCode);
    if (!voucher) throw new AppError('Voucher khong ton tai', 404);
  }

  // Chi tinh tien tren cac san pham da tich chon. Neu chua chon gi -> coi nhu chon het.
  const selectedItems = items.filter((item) => Number(item.is_selected) === 1);
  const itemsForTotal = selectedItems.length ? selectedItems : items;
  const totals = calcCartTotals(itemsForTotal, { memberLevel: user.member_level, voucher });

  return {
    cart_id: user.id,
    items,
    voucher,
    selected_count: selectedItems.length,
    ...totals,
  };
};

// Bat/tat tich chon mot san pham trong gio
export const selectItem = async (user: UserRow, itemId: number, selected: boolean) => {
  await cartModel.setItemSelected(user.id, itemId, selected);
  return getCart(user);
};

// Bat/tat tich chon tat ca san pham
export const selectAll = async (user: UserRow, selected: boolean) => {
  await cartModel.setAllSelected(user.id, selected);
  return getCart(user);
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

  await cartModel.addItem(user.id, variant_id, quantity);

  return getCart(user);
};

export const updateItem = async (user: UserRow, itemId: number, quantity: number) => {
  if (!quantity || quantity <= 0) {
    throw new AppError('So luong khong hop le', 400);
  }

  await cartModel.updateItemQuantity(user.id, itemId, quantity);

  return getCart(user);
};

export const removeItem = async (user: UserRow, itemId: number) => {
  await cartModel.removeItem(user.id, itemId);

  return getCart(user);
};
