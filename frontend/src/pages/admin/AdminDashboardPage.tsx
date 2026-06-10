import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/axios';
import { formatPrice, ORDER_STATUS_LABELS } from '../../utils/format';
import type { ApiResponse, DashboardStats, OrderStatus } from '../../types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  shipping: '#3b82f6',
  delivered: '#10b981',
  canceled: '#ef4444',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<ApiResponse<DashboardStats>>('/admin/statistics').then((res) => setStats(res.data.data));
  }, []);

  if (!stats) return <p>Đang tải...</p>;

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
      <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Tổng doanh thu (đơn đã giao)</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatPrice(stats.total_revenue)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Tổng số đơn hàng</p>
          <p className="text-2xl font-bold mt-1">{stats.order_count}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Đơn hàng chờ xử lý</p>
          <p className="text-2xl font-bold mt-1">
            {stats.status_counts.find((s) => s.status === 'pending')?.count || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="font-semibold mb-3">Doanh thu theo thời gian (đơn đã giao)</h2>
          {revenueData.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => formatPrice(value as number)} />
                <Line type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="font-semibold mb-3">Đơn hàng theo trạng thái</h2>
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

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h2 className="font-semibold mb-3">Top sản phẩm bán chạy</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.top_products} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={12} />
            <YAxis type="category" dataKey="name" width={150} fontSize={12} />
            <Tooltip />
            <Bar dataKey="sold_count" fill="#e11d48" name="Đã bán" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
