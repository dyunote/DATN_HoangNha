import * as voucherModel from '../models/voucherModel';
import { AppError } from '../utils/response';
import { isVoucherValid } from '../utils/pricing';
import { DiscountType } from '../types';

export const VALID_TYPES: DiscountType[] = ['percent', 'amount'];

export const listAll = () => voucherModel.findAll();

export const checkVoucher = async (code: string) => {
  const voucher = await voucherModel.findByCode(code);
  if (!voucher) throw new AppError('Voucher khong ton tai', 404);
  if (!isVoucherValid(voucher)) throw new AppError('Voucher khong hop le hoac da het han', 400);
  return voucher;
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
