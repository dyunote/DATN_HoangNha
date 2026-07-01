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
      <h1 className="font-display text-2xl font-medium text-ink mb-6">Quản lý đơn hàng</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setSearchParams({})} className={`hn-tab ${!status ? 'hn-tab-active' : ''}`}>
          Tất cả
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams({ status: s })}
            className={`hn-tab ${status === s ? 'hn-tab-active' : ''}`}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-soft">Đang tải...</p>
      ) : (
        <div className="hn-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/60 text-left text-xs uppercase tracking-[0.1em] text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Mã đơn</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Ngày đặt</th>
                <th className="px-4 py-3 font-medium">Tổng tiền</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-beige">
                  <td className="px-4 py-2">
                    <Link to={`/admin/orders/${order.id}`} className="text-ink hover:text-accent transition-colors font-medium">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-ink-soft">{order.customer_name}</td>
                  <td className="px-4 py-2 text-ink-soft">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-2">{formatPrice(order.total_amount)}</td>
                  <td className="px-4 py-2">
                    <span className={`hn-badge ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                      className="hn-input hn-auto text-xs py-1.5"
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
