import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Activity } from 'lucide-react'
import { ORDERS, ORDER_STATUS_META, PRODUCTS, formatVND } from '@/data'
import { adminApi, mapApiOrder, type AdminStats } from '@/api/services'
import { useCountUp } from '@/hooks/useCountUp'

const REVENUE = [
  { name: 'T1', revenue: 320, orders: 145 },
  { name: 'T2', revenue: 285, orders: 132 },
  { name: 'T3', revenue: 410, orders: 189 },
  { name: 'T4', revenue: 380, orders: 176 },
  { name: 'T5', revenue: 520, orders: 232 },
  { name: 'T6', revenue: 610, orders: 265 },
  { name: 'T7', revenue: 720, orders: 308 },
]

const CATEGORY_SHARE = [
  { name: 'Đầm & Váy', value: 32, color: '#111111' },
  { name: 'Áo khoác', value: 26, color: '#D6B98C' },
  { name: 'Sơ mi', value: 18, color: '#94A3B8' },
  { name: 'Quần', value: 14, color: '#B89A68' },
  { name: 'Khác', value: 10, color: '#E2E8F0' },
]

const ACTIVITIES = [
  { text: 'Đơn hàng mới #HN-24102 từ Minh Anh', time: '5 phút trước', dot: 'bg-success' },
  { text: 'Sản phẩm "Trench Coat Beige" sắp hết hàng', time: '22 phút trước', dot: 'bg-warning' },
  { text: 'Đánh giá 5★ mới cho "Đầm lụa Midi"', time: '1 giờ trước', dot: 'bg-accent' },
  { text: 'Khách hàng mới đăng ký: thao.nguyen@gmail.com', time: '2 giờ trước', dot: 'bg-blue-400' },
  { text: 'Voucher LUXURY100 đã được dùng 50 lần', time: '4 giờ trước', dot: 'bg-slate-300' },
]

const STATS = [
  { label: 'Doanh thu tháng', value: 720, suffix: 'M', icon: DollarSign, trend: 18.2, up: true },
  { label: 'Đơn hàng', value: 308, suffix: '', icon: ShoppingCart, trend: 12.5, up: true },
  { label: 'Khách hàng mới', value: 1284, suffix: '', icon: Users, trend: 8.1, up: true },
  { label: 'Sản phẩm tồn kho', value: 3420, suffix: '', icon: Package, trend: 2.4, up: false },
]

function StatCard({ stat, index }: { stat: (typeof STATS)[number]; index: number }) {
  const { ref, value } = useCountUp(stat.value)
  const Icon = stat.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-card border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/50 dark:border-white/5 dark:bg-zinc-900 dark:hover:shadow-black/40"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-ink transition-all duration-300 group-hover:bg-ink group-hover:text-accent dark:bg-white/10 dark:text-white">
          <Icon size={18} />
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${stat.up ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {stat.trend}%
        </span>
      </div>
      <p className="mt-4 font-display text-2xl font-semibold tabular-nums dark:text-white">
        <span ref={ref}>{value.toLocaleString('vi-VN')}</span>{stat.suffix}
      </p>
      <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
    </motion.div>
  )
}

const tooltipStyle = {
  borderRadius: 14,
  border: 'none',
  boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
  fontSize: 12,
  fontFamily: 'Inter',
}

export default function AdminDashboard() {
  // UC-24: số liệu thật từ backend (cần đăng nhập admin), fallback mock
  const [live, setLive] = useState<AdminStats | null>(null)

  useEffect(() => {
    adminApi.stats().then(setLive).catch(() => {})
  }, [])

  const stats = live
    ? [
        { label: 'Tổng doanh thu', value: Math.round(live.revenue / 1000), suffix: 'K', icon: DollarSign, trend: 18.2, up: true },
        { label: 'Đơn hàng', value: live.orders, suffix: '', icon: ShoppingCart, trend: 12.5, up: true },
        { label: 'Khách hàng', value: live.customers, suffix: '', icon: Users, trend: 8.1, up: true },
        { label: 'Sản phẩm', value: live.products, suffix: '', icon: Package, trend: 2.4, up: false },
      ]
    : STATS

  const recentOrders = live ? live.recentOrders.map(mapApiOrder) : ORDERS

  const bestSellers = live
    ? live.bestSellers.map((b) => ({ id: b.id, name: b.name, category: b.category, price: b.price, sold: b.sold, stock: 20, images: [b.image ?? ''] }))
    : [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Tổng quan hoạt động kinh doanh — Tháng 7, 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s, i) => <StatCard key={s.label} stat={s} index={i} />)}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-card border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-zinc-900"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold dark:text-white">Doanh thu (triệu đồng)</h2>
              <p className="mt-0.5 text-xs text-slate-400">7 tháng gần nhất</p>
            </div>
            <span className="rounded-full bg-success/10 px-3 py-1 text-[11px] font-bold text-success">+18.2% so với kỳ trước</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={REVENUE}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D6B98C" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#D6B98C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={36} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#B89A68" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
          className="rounded-card border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-zinc-900"
        >
          <h2 className="text-sm font-semibold dark:text-white">Tỷ trọng danh mục</h2>
          <p className="mt-0.5 text-xs text-slate-400">Theo doanh thu</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={CATEGORY_SHARE} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                {CATEGORY_SHARE.map((c) => <Cell key={c.name} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-2">
            {CATEGORY_SHARE.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="flex-1 text-slate-500 dark:text-slate-400">{c.name}</span>
                <span className="font-semibold dark:text-white">{c.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Orders bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34, duration: 0.5 }}
          className="rounded-card border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-zinc-900"
        >
          <h2 className="mb-5 text-sm font-semibold dark:text-white">Đơn hàng theo tháng</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REVENUE}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(214,185,140,0.08)' }} />
              <Bar dataKey="orders" name="Đơn hàng" fill="#111111" radius={[8, 8, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-card border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-zinc-900"
        >
          <h2 className="mb-5 text-sm font-semibold dark:text-white">Đơn hàng gần đây</h2>
          <div className="space-y-4">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3">
                <img src={o.items[0].image} alt="" className="h-10 w-8 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold dark:text-white">#{o.id}</p>
                  <p className="text-[11px] text-slate-400">{o.date}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${ORDER_STATUS_META[o.status].color}`}>
                  {ORDER_STATUS_META[o.status].label}
                </span>
                <span className="text-xs font-semibold tabular-nums dark:text-white">{formatVND(o.total)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, duration: 0.5 }}
          className="rounded-card border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-zinc-900"
        >
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold dark:text-white">
            <Activity size={15} className="text-accent-dark" /> Hoạt động
          </h2>
          <div className="relative space-y-5 before:absolute before:top-1 before:bottom-1 before:left-[5px] before:w-px before:bg-slate-100 dark:before:bg-white/10">
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="relative flex gap-4 pl-0">
                <span className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white dark:ring-zinc-900 ${a.dot}`} />
                <div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{a.text}</p>
                  <p className="mt-0.5 text-[10px] tracking-wide text-slate-400 uppercase">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Best sellers table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
        className="overflow-hidden rounded-card border border-slate-200/60 bg-white dark:border-white/5 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-sm font-semibold dark:text-white">Sản phẩm bán chạy</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-[11px] tracking-wider text-slate-400 uppercase dark:border-white/5">
                <th className="px-6 py-3 font-medium">Sản phẩm</th>
                <th className="px-6 py-3 font-medium">Danh mục</th>
                <th className="px-6 py-3 font-medium">Giá</th>
                <th className="px-6 py-3 font-medium">Đã bán</th>
                <th className="px-6 py-3 font-medium">Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-white/5 dark:hover:bg-white/[0.03]">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="h-11 w-9 rounded-lg object-cover" />
                      <span className="font-medium dark:text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">{p.category}</td>
                  <td className="px-6 py-3.5 font-medium tabular-nums dark:text-white">{formatVND(p.price)}</td>
                  <td className="px-6 py-3.5 tabular-nums dark:text-white">{p.sold}</td>
                  <td className="px-6 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${p.stock < 10 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                      {p.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
