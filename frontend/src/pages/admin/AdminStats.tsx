import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { PRODUCTS, formatVND } from '@/data'
import { PageHeader, Card } from './shared'

const MONTHLY = [
  { name: 'T1', revenue: 320 }, { name: 'T2', revenue: 285 }, { name: 'T3', revenue: 410 },
  { name: 'T4', revenue: 380 }, { name: 'T5', revenue: 520 }, { name: 'T6', revenue: 610 }, { name: 'T7', revenue: 720 },
]

const TOP_CATEGORIES = [
  { name: 'Đầm & Váy', value: 245 }, { name: 'Áo khoác', value: 198 }, { name: 'Sơ mi', value: 141 },
  { name: 'Quần', value: 112 }, { name: 'Áo thun', value: 96 }, { name: 'Phụ kiện', value: 54 },
]

const TOP_CUSTOMERS = [
  { name: 'Quốc Bảo', spent: 32600000, orders: 21, avatar: 'https://i.pravatar.cc/80?img=12' },
  { name: 'Hữu Phước', spent: 21800000, orders: 15, avatar: 'https://i.pravatar.cc/80?img=68' },
  { name: 'Minh Anh', spent: 18400000, orders: 12, avatar: 'https://i.pravatar.cc/80?img=47' },
  { name: 'Thảo Nguyên', spent: 9200000, orders: 8, avatar: 'https://i.pravatar.cc/80?img=32' },
]

const tooltipStyle = { borderRadius: 14, border: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', fontSize: 12 }

export default function AdminStats() {
  const bestSellers = [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 6)

  return (
    <div>
      <PageHeader title="Thống kê" subtitle="Phân tích chi tiết hiệu quả kinh doanh" />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-5 text-sm font-semibold dark:text-white">Xu hướng doanh thu (triệu đồng)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={36} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#111111" strokeWidth={2.5} dot={{ fill: '#D6B98C', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#B89A68' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6" delay={0.08}>
          <h2 className="mb-5 text-sm font-semibold dark:text-white">Top danh mục (sản phẩm bán ra)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={TOP_CATEGORIES} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={78} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(214,185,140,0.08)' }} />
              <Bar dataKey="value" name="Đã bán" fill="#D6B98C" radius={[0, 8, 8, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6" delay={0.14}>
          <h2 className="mb-5 text-sm font-semibold dark:text-white">Sản phẩm bán chạy</h2>
          <div className="space-y-4">
            {bestSellers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                <span className="font-display w-6 text-lg font-semibold text-slate-300 italic">{i + 1}</span>
                <img src={p.images[0]} alt="" className="h-12 w-9 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium dark:text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{formatVND(p.price)}</p>
                </div>
                <div className="w-28">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-ink dark:bg-white" style={{ width: `${(p.sold / bestSellers[0].sold) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[11px] text-slate-400 tabular-nums">{p.sold} đã bán</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6" delay={0.2}>
          <h2 className="mb-5 text-sm font-semibold dark:text-white">Khách hàng thân thiết</h2>
          <div className="space-y-4">
            {TOP_CUSTOMERS.map((c, i) => (
              <div key={c.name} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-3.5 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 dark:border-white/5">
                <span className="font-display w-5 text-lg font-semibold text-slate-300 italic">{i + 1}</span>
                <img src={c.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold dark:text-white">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.orders} đơn hàng</p>
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
