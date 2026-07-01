import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/axios';
import { formatPrice, ORDER_STATUS_LABELS } from '../../utils/format';
import type { ApiResponse, DashboardStats, OrderStatus } from '../../types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  shipping: '#3b82f6',
  delivered: '#10b981',
  canceled: '#ef4444',
};

// Màu nhấn chủ đạo (camel) dùng cho biểu đồ để khớp toàn site
const ACCENT = '#a4754f';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<ApiResponse<DashboardStats>>('/admin/statistics').then((res) => setStats(res.data.data));
  }, []);

  if (!stats) return <p className="text-ink-soft">Đang tải...</p>;

  const statusData = stats.status_counts.map((s) => ({
    name: ORDER_STATUS_LABELS[s.status] || s.status,
    value: s.count,
    status: s.status,
  }));

  const revenueData = stats.revenue_by_date.map((r) => ({
    date: new Date(r.date).toLocaleDateString('vi-VN'),
    revenue: Number(r.revenue),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink mb-6">Tổng quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="hn-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-ink-soft">Tổng doanh thu (đơn đã giao)</p>
          <p className="font-display text-2xl text-accent mt-2">{formatPrice(stats.total_revenue)}</p>
        </div>
        <div className="hn-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-ink-soft">Tổng số đơn hàng</p>
          <p className="font-display text-2xl text-ink mt-2">{stats.order_count}</p>
        </div>
        <div className="hn-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-ink-soft">Đơn hàng chờ xử lý</p>
          <p className="font-display text-2xl text-ink mt-2">
            {stats.status_counts.find((s) => s.status === 'pending')?.count || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="hn-panel p-5">
          <h2 className="text-sm uppercase tracking-[0.15em] text-ink mb-4">Doanh thu theo thời gian (đơn đã giao)</h2>
          {revenueData.length === 0 ? (
            <p className="text-sm text-ink-soft">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9e2d6" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => formatPrice(value as number)} />
                <Line type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="hn-panel p-5">
          <h2 className="text-sm uppercase tracking-[0.15em] text-ink mb-4">Đơn hàng theo trạng thái</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#999'} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
