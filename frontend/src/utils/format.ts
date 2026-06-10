import type { MemberLevel, OrderStatus, PaymentMethod } from '../types';

export const formatPrice = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString('vi-VN') + 'đ';

export const formatDate = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  canceled: 'Đã hủy',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  shipping: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  canceled: 'bg-red-100 text-red-700',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  e_wallet: 'Ví điện tử',
};

export const MEMBER_LEVEL_LABELS: Record<MemberLevel, string> = {
  normal: 'Thường',
  silver: 'Bạc',
  gold: 'Vàng',
  vip: 'VIP',
};
