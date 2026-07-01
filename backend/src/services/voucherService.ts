import * as voucherModel from '../models/voucherModel';
import { AppError } from '../utils/response';
import { isVoucherValid } from '../utils/pricing';
import { DiscountType, UserRow } from '../types';

export const VALID_TYPES: DiscountType[] = ['percent', 'amount'];

export const listAll = () => voucherModel.findAll();

export const checkVoucher = async (code: string) => {
  const voucher = await voucherModel.findByCode(code);
  if (!voucher) throw new AppError('Voucher khong ton tai', 404);
  if (!isVoucherValid(voucher)) throw new AppError('Voucher khong hop le hoac da het han', 400);
  return voucher;
};

// Danh sach voucher khach co the luu (dang hieu luc), kem danh dau da luu
export const listAvailable = async (userId?: number) => {
  const vouchers = await voucherModel.findActive();
  const result = vouchers.map((v) => ({ ...v, is_valid: isVoucherValid(v), saved: false }));
  if (userId) {
    const saved = await voucherModel.savedVoucherIds(userId);
    result.forEach((v) => {
      v.saved = saved.has(v.id);
    });
  }
  return result;
};

// Khach luu voucher vao kho (theo ma code)
export const saveVoucher = async (user: UserRow, code: string) => {
  if (!code) throw new AppError('Vui long nhap ma voucher', 400);
  const voucher = await voucherModel.findByCode(code.trim());
  if (!voucher) throw new AppError('Ma voucher khong ton tai', 404);
  if (!isVoucherValid(voucher)) throw new AppError('Voucher da het han hoac het luot', 400);
  await voucherModel.saveForUser(user.id, voucher.id);
  return { ...voucher, saved: true, is_valid: true };
};

// Kho voucher cua user (kem trang thai con hieu luc)
export const myVouchers = async (userId: number) => {
  const vouchers = await voucherModel.findSavedByUser(userId);
  return vouchers.map((v) => ({ ...v, saved: true, is_valid: isVoucherValid(v) }));
};

type VoucherPayload = Parameters<typeof voucherModel.create>[0];

export const validateInput = ({
  code,
  discount_type,
  discount_value,
  start_date,
  end_date,
  quantity,
}: VoucherPayload) => {
  if (!code || !discount_type || discount_value === undefined || !start_date || !end_date) {
    throw new AppError('Vui long nhap day du thong tin voucher', 400);
  }
  if (!(VALID_TYPES as string[]).includes(discount_type)) {
    throw new AppError('Loai giam gia khong hop le', 400);
  }
  if (Number(discount_value) <= 0) {
    throw new AppError('Gia tri giam gia khong hop le', 400);
  }
  if (quantity !== undefined && Number(quantity) < 0) {
    throw new AppError('So luong voucher khong hop le', 400);
  }
};

export const create = async (payload: VoucherPayload) => {
  validateInput(payload);
  const existing = await voucherModel.findByCode(payload.code);
  if (existing) throw new AppError('Ma voucher da ton tai', 400);

  const id = await voucherModel.create(payload);
  return voucherModel.findById(id);
};

export const update = async (id: number, payload: VoucherPayload) => {
  const voucher = await voucherModel.findById(id);
  if (!voucher) throw new AppError('Khong tim thay voucher', 404);

  validateInput(payload);
  await voucherModel.update(id, payload);
  return voucherModel.findById(id);
};
