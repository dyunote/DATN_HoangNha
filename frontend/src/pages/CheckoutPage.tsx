import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice, PAYMENT_METHOD_LABELS } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import { BANK_INFO, buildVietQrUrl } from '../config/bank';
import type { ApiResponse, Order, PaymentMethod } from '../types';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { voucher_code?: string } | null;
  const voucherCode = state?.voucher_code || '';

  const [form, setForm] = useState<{
    receiver_name: string;
    phone: string;
    address: string;
    note: string;
    payment_method: PaymentMethod;
  }>({
    receiver_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    note: '',
    payment_method: 'cod',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!cart || cart.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<Order>>('/orders', { ...form, voucher_code: voucherCode || undefined });
      await refreshCart();
      navigate(`/orders/${res.data.data.id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Đặt hàng thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold mb-1">Thông tin nhận hàng</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Họ và tên</label>
            <input
              name="receiver_name"
              value={form.receiver_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <h2 className="font-semibold mb-1 pt-2">Phương thức thanh toán</h2>
          <div className="space-y-2">
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm border border-gray-200 rounded px-3 py-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value={value}
                  checked={form.payment_method === value}
                  onChange={handleChange}
                />
                {label}
              </label>
            ))}
          </div>

          {form.payment_method === 'bank_transfer' && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-sm font-medium mb-2">Quét mã QR để chuyển khoản</p>
              <img
                src={buildVietQrUrl(cart.total, 'Thanh toan don hang Hoang Nha')}
                alt="Ma QR chuyen khoan"
                className="w-56 h-auto mx-auto rounded border border-gray-200 bg-white"
              />
              <div className="text-sm text-gray-600 mt-3 space-y-0.5">
                <p>Ngân hàng: <span className="font-medium uppercase">{BANK_INFO.bankCode}</span></p>
                <p>Số tài khoản: <span className="font-medium">{BANK_INFO.accountNo}</span></p>
                <p>Chủ tài khoản: <span className="font-medium">{BANK_INFO.accountName}</span></p>
                <p>Số tiền: <span className="font-semibold text-rose-600">{formatPrice(cart.total)}</span></p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Mở app ngân hàng, quét mã, số tiền và nội dung sẽ tự điền. Sau khi đặt hàng vẫn xem lại được mã QR ở chi tiết đơn.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </form>

        <div className="bg-white border border-gray-200 rounded-lg p-4 h-fit">
          <h2 className="font-semibold mb-3">Đơn hàng của bạn</h2>
          <div className="space-y-2 mb-3">
            {cart.items.map((item) => (
              <div key={item.cart_item_id} className="flex justify-between text-sm">
                <span>
                  {item.product_name} ({item.size}/{item.color}) x{item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm border-t border-gray-100 pt-2">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            {cart.member_discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Ưu đãi thành viên</span>
                <span>-{formatPrice(cart.member_discount)}</span>
              </div>
            )}
            {cart.voucher_discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Giảm giá voucher</span>
                <span>-{formatPrice(cart.voucher_discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2">
              <span>Tổng cộng</span>
              <span className="text-rose-600">{formatPrice(cart.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
