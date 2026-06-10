import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatDate, formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../utils/format';
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

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Đơn hàng #{order.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
              <p className="text-rose-600 font-semibold mt-1">{formatPrice(order.total_amount)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
