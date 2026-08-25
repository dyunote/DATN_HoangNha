import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Activity, AlertTriangle } from 'lucide-react'
import { ORDER_STATUS_META, formatVND } from '@/data'
import { adminApi, mapApiOrder, type AdminStats } from '@/api/services'
import { apiMessage } from '@/api/error'
import { useCountUp } from '@/hooks/useCountUp'

// Bảng màu cho biểu đồ tròn — gán theo thứ tự danh mục trả về từ API
const PIE_COLORS = ['#111111', '#D6B98C', '#94A3B8', '#B89A68', '#E2E8F0', '#64748B']

interface StatItem {
  label: string
  value: number
  suffix: string
  icon: typeof DollarSign
  /** Dòng chú thích nhỏ dưới nhãn — nói rõ con số đang đếm cái gì */
  hint?: string
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
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
      </div>
      <p className="mt-4 font-display text-2xl font-semibold tabular-nums dark:text-white">
        <span ref={ref}>{value.toLocaleString('vi-VN')}</span>{stat.suffix}
      </p>
      <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
      {stat.hint && <p className="mt-0.5 text-[10px] leading-snug text-slate-400/80">{stat.hint}</p>}
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
  // UC-24: toàn bộ số liệu lấy từ database (cần đăng nhập admin)
  const [live, setLive] = useState<AdminStats | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    adminApi.stats().then(setLive).catch((err) => setLoadError(apiMessage(err, 'Không tải được số liệu')))
  }, [])

  const stats: StatItem[] = [
    {
      label: 'Tổng doanh thu',
      value: Math.round((live?.revenue ?? 0) / 1000),
      suffix: 'K',
      icon: DollarSign,
      // Nói thẳng quy tắc tính ngay trên thẻ số: trước đây con số này gộp cả
      // đơn COD chưa thu tiền và cả phí ship nên luôn cao hơn tiền thật.
      hint: `${live?.revenueOrderCount ?? 0} đơn đã giao & đã thanh toán · chưa gồm phí ship`,
    },
    { label: 'Đơn hàng', value: live?.orders ?? 0, suffix: '', icon: ShoppingCart, hint: 'tổng số đơn đã đặt (mọi trạng thái)' },
    { label: 'Khách hàng', value: live?.customers ?? 0, suffix: '', icon: Users },
    { label: 'Sản phẩm', value: live?.products ?? 0, suffix: '', icon: Package },
  ]

  const recentOrders = live ? live.recentOrders.map(mapApiOrder) : []
  const revenueData = live?.revenueByMonth ?? []
  const categoryShare = live?.categoryShare ?? []

  const bestSellers = live
    ? live.bestSellers.map((b) => ({ id: b.id, name: b.name, category: b.category, price: b.price, sold: b.sold, stock: b.stock, images: [b.image ?? ''] }))
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="title-panel dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Tổng quan hoạt động kinh doanh</p>
      </div>

      {loadError && <p className="rounded-card bg-danger/10 px-5 py-4 text-sm text-danger">{loadError}</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s, i) => <StatCard key={s.label} stat={s} index={i} />)}
      </div>

      {/* Giải thích phần CHÊNH giữa tổng tiền đơn hàng và doanh thu.
          Không có dòng này thì admin cộng tay danh sách đơn rồi thấy lệch với
          dashboard mà không hiểu vì sao. */}
      {!!live?.unpaidDeliveredCount && (
        <div className="flex flex-wrap items-center gap-2 rounded-card bg-amber-50 px-5 py-3.5 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            <b>{live.unpaidDeliveredCount} đơn</b> đã giao thành công nhưng chưa thu được tiền
            {' '}(<b>{formatVND(live.unpaidDeliveredAmount ?? 0)}</b>) — chưa được tính vào doanh thu.
          </span>
          <Link to="/admin/don-hang" className="link-underline font-semibold">
            Xem đơn hàng →
          </Link>
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-card border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-zinc-900"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="label-section dark:text-white">Doanh thu (triệu đồng)</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                7 tháng gần nhất · chỉ đơn đã giao &amp; đã thanh toán, không gồm phí ship
              </p>
            </div>
            {/* So sánh tháng này với tháng trước, tính từ chính dữ liệu biểu đồ */}
            {(() => {
              const n = revenueData.length
              if (n < 2 || !revenueData[n - 2].revenue) return null
              const pct = ((revenueData[n - 1].revenue - revenueData[n - 2].revenue) / revenueData[n - 2].revenue) * 100
              const up = pct >= 0
              return (
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${up ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {up ? '+' : ''}{pct.toFixed(1)}% so với tháng trước
                </span>
              )
            })()}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D6B98C" />
                  <stop offset="100%" stopColor="#B89A68" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={36} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(214, 185, 140, 0.08)' }} />
              <Bar dataKey="revenue" name="Doanh thu" fill="url(#rev)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
          className="rounded-card border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-zinc-900"
        >
          <h2 className="label-section dark:text-white">Tỷ trọng danh mục</h2>
          <p className="mt-0.5 text-xs text-slate-400">Theo số lượng đã bán</p>
          {categoryShare.length === 0 ? (
            <p className="py-16 text-center text-xs text-slate-400">Chưa có dữ liệu bán hàng</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryShare} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                    {categoryShare.map((c, i) => <Cell key={c.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-2">
                {categoryShare.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 text-slate-500 dark:text-slate-400">{c.name}</span>
                    <span className="font-semibold dark:text-white">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Orders bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34, duration: 0.5 }}
          className="rounded-card border border-slate-200/60 bg-white p-6 dark:border-white/5 dark:bg-zinc-900"
        >
          <h2 className="label-section mb-5 dark:text-white">Đơn hàng theo tháng</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
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
          <h2 className="label-section mb-5 dark:text-white">Đơn hàng gần đây</h2>
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
          <h2 className="label-section mb-5 flex items-center gap-2 dark:text-white">
            <Activity size={15} className="text-accent-dark" /> Hoạt động gần đây
          </h2>
          {recentOrders.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">Chưa có hoạt động nào</p>
          ) : (
            <div className="relative space-y-5 before:absolute before:top-1 before:bottom-1 before:left-[5px] before:w-px before:bg-slate-100 dark:before:bg-white/10">
              {/* Dựng từ đơn hàng thật thay vì danh sách sự kiện bịa sẵn */}
              {recentOrders.slice(0, 5).map((o) => (
                <div key={o.id} className="relative flex gap-4 pl-0">
                  <span className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white dark:ring-zinc-900 ${
                    o.status === 'cancelled' ? 'bg-danger' : o.status === 'delivered' ? 'bg-success' : 'bg-accent'
                  }`} />
                  <div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      Đơn #{o.id} · {o.customer ?? 'Khách'} — {ORDER_STATUS_META[o.status].label}
                    </p>
                    <p className="mt-0.5 text-[10px] tracking-wide text-slate-400 uppercase">{o.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Best sellers table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
        className="overflow-hidden rounded-card border border-slate-200/60 bg-white dark:border-white/5 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="label-section dark:text-white">Sản phẩm bán chạy</h2>
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
