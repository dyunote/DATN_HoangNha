import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatDate, formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../utils/format';
import PageHeader from '../components/PageHeader';
import type { ApiResponse, Order } from '../types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<Order[]>>('/orders')
      .then((res) => setOrders(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ink-soft">Đang tải...</p>;

  return (
    <div>
      <PageHeader eyebrow="Đơn hàng" title="Đơn hàng của tôi" />

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-beige bg-white">
          <p className="text-ink-soft mb-6">Bạn chưa có đơn hàng nào.</p>
          <Link to="/products" className="hn-btn">
            Bắt đầu mua sắm <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white border border-beige p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-ink">Đơn hàng #{order.id}</span>
                <span className={`hn-badge ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className="text-sm text-ink-soft">{formatDate(order.created_at)}</p>
              <p className="text-accent font-medium mt-1">{formatPrice(order.total_amount)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
