import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../utils/format';
import type { ApiResponse, Order, OrderStatus } from '../../types';

const STATUSES: OrderStatus[] = ['pending', 'shipping', 'delivered', 'canceled'];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);

  const load = () => {
    api.get<ApiResponse<Order>>(`/admin/orders/${id}`).then((res) => setOrder(res.data.data));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
    load();
  };

  if (!order) return <p className="text-ink-soft">Đang tải...</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/admin/orders" className="text-xs uppercase tracking-wider text-accent hover:text-accent-dark">
        &larr; Quay lại danh sách đơn hàng
      </Link>

      <div className="hn-panel p-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-xl font-medium text-ink">Đơn hàng #{order.id}</h1>
          <span className={`hn-badge ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="text-sm space-y-1 mb-4 text-ink-soft">
          <p>Khách hàng: {order.customer_name} ({order.customer_email})</p>
          <p>Ngày đặt: {formatDate(order.created_at)}</p>
          <p>Người nhận: {order.receiver_name}</p>
          <p>Số điện thoại: {order.phone}</p>
          <p>Địa chỉ: {order.address}</p>
          {order.note && <p>Ghi chú: {order.note}</p>}
          {order.payment && (
            <p>
              Thanh toán: {PAYMENT_METHOD_LABELS[order.payment.method]} -{' '}
              {order.payment.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="hn-label">Cập nhật trạng thái</label>
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            className="hn-input hn-auto"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <h2 className="text-sm uppercase tracking-[0.18em] text-ink mb-3">Sản phẩm</h2>
        <div className="space-y-2 mb-4">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex gap-3 items-center">
              <img src={item.image} alt={item.product_name} className="w-14 h-16 object-cover bg-beige" />
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

        <div className="border-t border-beige pt-3 flex justify-between font-semibold">
          <span>Tổng cộng</span>
          <span className="text-accent">{formatPrice(order.total_amount)}</span>
        </div>
      </div>
    </div>
  );
}
