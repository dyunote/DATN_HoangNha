import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../utils/format';
import type { ApiResponse, Order, OrderStatus } from '../../types';

const STATUSES: OrderStatus[] = ['pending', 'shipping', 'delivered', 'canceled'];

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const status = searchParams.get('status') || '';

  const load = () => {
    setLoading(true);
    api
      .get<ApiResponse<Order[]>>('/admin/orders', { params: status ? { status } : {} })
      .then((res) => setOrders(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    await api.patch(`/admin/orders/${order.id}/status`, { status: newStatus });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quản lý đơn hàng</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSearchParams({})}
          className={`px-3 py-1.5 rounded-full text-sm border ${!status ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300'}`}
        >
          Tất cả
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams({ status: s })}
            className={`px-3 py-1.5 rounded-full text-sm border ${status === s ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300'}`}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Mã đơn</th>
                <th className="px-4 py-2">Khách hàng</th>
                <th className="px-4 py-2">Ngày đặt</th>
                <th className="px-4 py-2">Tổng tiền</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <Link to={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{order.customer_name}</td>
                  <td className="px-4 py-2">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-2">{formatPrice(order.total_amount)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
