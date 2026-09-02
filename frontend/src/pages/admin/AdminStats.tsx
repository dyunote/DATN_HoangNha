import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatVND } from '@/data'
import { useProducts } from '@/hooks/useProducts'
import { adminApi, type AdminStats as AdminStatsData } from '@/api/services'
import { PageHeader, Card } from './shared'

const tooltipStyle = { borderRadius: 14, border: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', fontSize: 12 }

interface TopCustomer {
  name: string
  spent: number
  orders: number
  avatar: string | null
}

export default function AdminStats() {
  // Toàn bộ số liệu lấy từ database
  const { products } = useProducts()
  const [live, setLive] = useState<AdminStatsData | null>(null)
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])

  useEffect(() => {
    adminApi.stats().then(setLive).catch(() => {})
    // Khách hàng chi tiêu nhiều nhất — lấy từ danh sách khách thật rồi sắp xếp
    adminApi
      .customers()
      .then((list) =>
        setTopCustomers(
          [...list]
            .sort((a, b) => b.spent - a.spent)
            .slice(0, 4)
            .map((c) => ({ name: c.name, spent: c.spent, orders: c.orderCount, avatar: c.avatar })),
        ),
      )
      .catch(() => {})
  }, [])

  const monthly = live?.revenueByMonth ?? []
  const topCategories = live?.categoryShare.slice(0, 6) ?? []
  const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 6)

  return (
    <div>
      <PageHeader title="Thống kê" subtitle="Phân tích chi tiết hiệu quả kinh doanh" />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="label-section mb-1 dark:text-white">Xu hướng doanh thu (triệu đồng)</h2>
          {/* Cùng một định nghĩa doanh thu với dashboard — backend/src/lib/revenue.ts */}
          <p className="mb-4 text-xs text-muted">Chỉ tính đơn đã giao &amp; đã thanh toán · tiền hàng sau giảm giá, không gồm phí ship</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={36} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#111111" strokeWidth={2.5} dot={{ fill: '#D6B98C', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#B89A68' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6" delay={0.08}>
          <h2 className="label-section mb-5 dark:text-white">Top danh mục (sản phẩm bán ra)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCategories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={78} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(214,185,140,0.08)' }} />
              <Bar dataKey="value" name="Đã bán" fill="#D6B98C" radius={[0, 8, 8, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6" delay={0.14}>
          <h2 className="label-section mb-5 dark:text-white">Sản phẩm bán chạy</h2>
          <div className="space-y-4">
            {bestSellers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                <span className="font-display w-6 text-lg font-semibold text-slate-300 italic">{i + 1}</span>
                <img src={p.images[0]} alt="" className="h-12 w-9 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium dark:text-white">{p.name}</p>
                  <p className="text-xs text-muted">{formatVND(p.price)}</p>
                </div>
                <div className="w-28">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    {/* Chia cho 1 khi chưa ai bán được gì — tránh NaN width */}
                    <div className="h-full rounded-full bg-ink dark:bg-white" style={{ width: `${(p.sold / (bestSellers[0].sold || 1)) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[11px] text-muted tabular-nums">{p.sold} đã bán</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6" delay={0.2}>
          <h2 className="label-section mb-1 dark:text-white">Khách hàng thân thiết</h2>
          <p className="mb-4 text-xs text-muted">Số tiền đã chi tính theo cùng quy tắc doanh thu</p>
          <div className="space-y-4">
            {topCustomers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-3.5 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 dark:border-white/5">
                <span className="font-display w-5 text-lg font-semibold text-slate-300 italic">{i + 1}</span>
                <img src={c.avatar ?? undefined} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold dark:text-white">{c.name}</p>
                  <p className="text-xs text-muted">{c.orders} đơn hàng</p>
                </div>
                <span className="text-sm font-semibold tabular-nums dark:text-white">{formatVND(c.spent)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
