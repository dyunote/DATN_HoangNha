import { AppError } from './response';
import { CartTotals, MemberLevel, VoucherRow } from '../types';

// Ty le giam gia theo hang thanh vien
const MEMBER_DISCOUNT_RATES: Record<MemberLevel, number> = {
  normal: 0,
  silver: 0.02,
  gold: 0.05,
  vip: 0.1,
};

export const getMemberDiscountRate = (memberLevel?: MemberLevel) =>
  (memberLevel && MEMBER_DISCOUNT_RATES[memberLevel]) || 0;

// Tinh tien giam gia tu voucher tren mot khoan tien goc
export const calcVoucherDiscount = (voucher: VoucherRow | null | undefined, amount: number) => {
  if (!voucher) return 0;
  if (voucher.discount_type === 'percent') {
    return Math.round((amount * Number(voucher.discount_value)) / 100);
  }
  return Math.min(Number(voucher.discount_value), amount);
};

// Kiem tra voucher con hieu luc khong
export const isVoucherValid = (voucher: VoucherRow | null | undefined) => {
  if (!voucher || !voucher.is_active) return false;
  if (voucher.quantity <= 0) return false;
  const now = new Date();
  const start = new Date(voucher.start_date);
  const end = new Date(voucher.end_date);
  end.setHours(23, 59, 59, 999);
  return now >= start && now <= end;
};

interface CartItemLike {
  price: number;
  quantity: number;
}

interface CalcCartTotalsOptions {
  memberLevel?: MemberLevel;
  voucher?: VoucherRow | null;
}

// Tinh tong tien gio hang: tam tinh -> giam theo hang thanh vien -> giam theo voucher
export const calcCartTotals = (items: CartItemLike[], { memberLevel, voucher }: CalcCartTotalsOptions = {}): CartTotals => {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const memberDiscountRate = getMemberDiscountRate(memberLevel);
  const memberDiscount = Math.round(subtotal * memberDiscountRate);

  const afterMemberDiscount = subtotal - memberDiscount;

  let voucherDiscount = 0;
  if (voucher) {
    if (!isVoucherValid(voucher)) {
      throw new AppError('Voucher khong hop le hoac da het han', 400);
    }
    voucherDiscount = calcVoucherDiscount(voucher, afterMemberDiscount);
  }

  const total = Math.max(0, afterMemberDiscount - voucherDiscount);

  return {
    subtotal,
    member_discount_rate: memberDiscountRate,
    member_discount: memberDiscount,
    voucher_discount: voucherDiscount,
    total,
  };
};
