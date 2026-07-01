import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { formatDate, formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../utils/format';
import { BANK_INFO, buildVietQrUrl } from '../config/bank';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/error';
import type { ApiResponse, Order, Payment, OrderStatus } from '../types';

// Cac buoc giao hang (khong tinh trang thai 'canceled')
const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
];

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'canceled') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">
        Đơn hàng đã bị hủy.
      </div>
    );
  }
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center mb-5">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step.key} className="flex-1 flex items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full grid place-items-center text-xs font-semibold ${
                  done ? 'bg-accent text-cream' : 'bg-beige text-ink-soft'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`mt-1 text-[11px] ${done ? 'text-accent font-medium' : 'text-ink-soft/70'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${i < currentIndex ? 'bg-accent' : 'bg-beige-dark'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    setOrder(res.data.data);
    const pm = res.data.data.payment;
    if (pm?.method === 'bank_transfer') {
      try {
        const pr = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
        setPayment(pr.data.data);
      } catch {
        setPayment(pm);
      }
    } else {
      setPayment(pm || null);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await load();
      toast.show('Đã cập nhật trạng thái thanh toán');
    } finally {
      setChecking(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return;
    setCanceling(true);
    try {
      await api.patch(`/orders/${id}/cancel`);
      await load();
      toast.success('Đã hủy đơn hàng');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Hủy đơn thất bại'));
    } finally {
      setCanceling(false);
    }
  };

  if (loading) return <p className="text-ink-soft">Đang tải...</p>;
  if (!order) return <p className="text-ink-soft">Không tìm thấy đơn hàng.</p>;

  const pay = payment || order.payment || null;
  const isBank = pay?.method === 'bank_transfer';
  const isPaid = pay?.status === 'paid';
  const transferCode = pay?.payment_info?.transfer_code || `HN${order.id}`;
  const qrUrl = pay?.payment_info?.qr_url || buildVietQrUrl(Number(order.total_amount), transferCode);
  const bankName = pay?.payment_info?.bank || BANK_INFO.bankCode;
  const accountNo = pay?.payment_info?.account_number || BANK_INFO.accountNo;
  const accountName = pay?.payment_info?.account_name || BANK_INFO.accountName;

  return (
    <div className="max-w-2xl">
      <Link to="/account?tab=orders" className="text-xs uppercase tracking-wider text-accent hover:text-accent-dark">
        &larr; Quay lại danh sách đơn hàng
      </Link>

      <div className="hn-panel p-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-medium text-ink">Đơn hàng #{order.id}</h1>
          <span className={`hn-badge ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <OrderTimeline status={order.status} />

        <div className="text-sm space-y-1 mb-4 text-ink-soft">
          <p>Ngày đặt: {formatDate(order.created_at)}</p>
          <p>Người nhận: {order.receiver_name}</p>
          <p>Số điện thoại: {order.phone}</p>
          <p>Địa chỉ: {order.address}</p>
          {order.province && <p>Tỉnh/TP: {order.province}</p>}
          {order.note && <p>Ghi chú: {order.note}</p>}
          {pay && (
            <p>
              Thanh toán: {PAYMENT_METHOD_LABELS[pay.method]} -{' '}
              <span className={isPaid ? 'text-emerald-600 font-medium' : 'text-accent font-medium'}>
                {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </p>
          )}
        </div>

        {/* Khach tu huy don khi don con cho xu ly */}
        {order.status === 'pending' && (
          <button
            onClick={handleCancel}
            disabled={canceling}
            className="mb-4 border border-accent text-accent hover:bg-accent hover:text-cream text-xs uppercase tracking-wider font-medium px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {canceling ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </button>
        )}

        <h2 className="text-sm uppercase tracking-[0.18em] text-ink mb-3">Sản phẩm</h2>
        <div className="space-y-2 mb-4">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex gap-3 items-center">
              <img loading="lazy" src={item.image} alt={item.product_name} className="w-14 h-16 object-cover bg-beige" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-ink">{item.product_name}</p>
                <p className="text-ink-soft">
                  Size: {item.size} · Màu: {item.color} · SL: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-beige pt-3 space-y-1 text-sm">
          {order.subtotal != null && order.subtotal > 0 && (
            <div className="flex justify-between text-ink-soft">
              <span>Tạm tính</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
          )}
          {!!order.discount_amount && order.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Giảm giá</span>
              <span>-{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          {order.shipping_fee != null && (
            <div className="flex justify-between text-ink-soft">
              <span>Phí vận chuyển{order.shipping_distance_km ? ` (~${order.shipping_distance_km}km)` : ''}</span>
              <span>{order.shipping_fee > 0 ? formatPrice(order.shipping_fee) : 'Miễn phí'}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base pt-1">
            <span>Tổng cộng</span>
            <span className="text-accent">{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        {isBank && !isPaid && order.status !== 'canceled' && (
          <div className="border border-beige bg-beige/40 p-4 text-center mt-4">
            <p className="text-sm font-medium mb-2 text-ink">Quét mã QR để thanh toán đơn #{order.id}</p>
            {qrUrl && (
              <img loading="lazy"
                src={qrUrl}
                alt="Ma QR chuyen khoan"
                className="w-56 h-auto mx-auto border border-beige bg-white"
              />
            )}
            <div className="text-sm text-ink-soft mt-3 space-y-0.5">
              <p>Ngân hàng: <span className="font-medium uppercase text-ink">{bankName}</span></p>
              <p>Số tài khoản: <span className="font-medium text-ink">{accountNo}</span></p>
              <p>Chủ tài khoản: <span className="font-medium text-ink">{accountName}</span></p>
              <p>Nội dung: <span className="font-medium text-accent">{transferCode}</span></p>
              <p>Số tiền: <span className="font-semibold text-accent">{formatPrice(order.total_amount)}</span></p>
            </div>
            <p className="text-xs text-ink-soft/70 mt-2">
              Chuyển khoản đúng nội dung <strong className="text-ink">{transferCode}</strong>. Hệ thống tự xác nhận qua SePay sau vài giây.
            </p>
            <button onClick={handleCheck} disabled={checking} className="hn-btn-dark hn-btn-sm mt-3">
              {checking ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản · Kiểm tra'}
            </button>
          </div>
        )}

        {isBank && isPaid && (
          <div className="border border-emerald-200 bg-emerald-50 p-3 text-center mt-4 text-emerald-700 text-sm font-medium">
            ✓ Đã nhận được thanh toán cho đơn #{order.id}
          </div>
        )}
      </div>
    </div>
  );
}
