import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Heart, Ticket, Wallet } from 'lucide-react'
import { catalogApi } from '@/api/services'
import { ORDER_STATUS_META, formatVND } from '@/data'
import { useMyOrders } from '@/hooks/useMyOrders'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import { useCountUp } from '@/hooks/useCountUp'
import { spentOfOrders } from '@/lib/tier'
import Reveal from '@/components/ui/Reveal'
import { Skeleton } from '@/components/ui/Skeleton'

function StatCard({ icon, value, label, suffix = '', delay }: { icon: React.ReactNode; value: number; label: string; suffix?: string; delay: number }) {
  const { ref, value: v } = useCountUp(value)
  return (
    <Reveal direction="up" delay={delay}>
      <div className="group rounded-card bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-900 dark:ring-white/10">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark transition-transform duration-500 group-hover:scale-110">
          {icon}
        </span>
        <p className="font-display mt-4 text-3xl font-semibold dark:text-white">
          <span ref={ref}>{v.toLocaleString('vi-VN')}</span>{suffix}
        </p>
        <p className="mt-1 text-xs tracking-wider text-slate-400 uppercase">{label}</p>
      </div>
    </Reveal>
  )
}

export default function Dashboard() {
  const wishlist = useWishlist()
  const { user } = useAuth()
  // `loading` và `error` đã có sẵn trong hook nhưng trang này bỏ quên: đơn tải
  // lỗi thì khối "Đơn hàng gần đây" rỗng trơn, khách tưởng mình chưa mua gì.
  const { orders, loading: ordersLoading, error: ordersError } = useMyOrders()
  const totalSpentK = Math.round(spentOfOrders(orders) / 1000)
  // Số voucher còn hạn, lấy từ database thay vì gán cứng
  const [voucherCount, setVoucherCount] = useState(0)

  useEffect(() => {
    let mounted = true
    catalogApi
      .vouchers()
      .then((list) => mounted && setVoucherCount(list.length))
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <h1 className="title-panel dark:text-white">
        Xin chào, {user?.name?.split(' ').pop() ?? 'bạn'} 👋
      </h1>
      <p className="mt-2 text-sm text-slate-400">Đây là bảng điều khiển tài khoản của bạn.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard icon={<Package size={19} />} value={orders.length} label="Đơn hàng" delay={0} />
        <StatCard icon={<Heart size={19} />} value={wishlist.ids.length} label="Yêu thích" delay={0.08} />
        <StatCard icon={<Ticket size={19} />} value={voucherCount} label="Voucher khả dụng" delay={0.16} />
        <StatCard icon={<Wallet size={19} />} value={totalSpentK} suffix="K" label="Tổng chi tiêu" delay={0.24} />
      </div>

      <Reveal direction="up" delay={0.2}>
        <div className="mt-8 rounded-card bg-white p-7 shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="title-card dark:text-white">Đơn hàng gần đây</h2>
            <Link to="/tai-khoan/don-hang" className="link-underline text-xs font-semibold tracking-widest text-accent-dark uppercase">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-4">
            {ordersLoading &&
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 dark:border-white/10">
                  <Skeleton className="h-14 w-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-28 rounded-md" />
                    <Skeleton className="h-3 w-48 rounded-md" />
                  </div>
                </div>
              ))}
            {!ordersLoading && ordersError && (
              <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                Không tải được đơn hàng. Kiểm tra kết nối rồi tải lại trang.
              </p>
            )}
            {!ordersLoading && !ordersError && orders.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                Bạn chưa có đơn hàng nào.
              </p>
            )}
            {orders.slice(0, 3).map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 p-4 transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 dark:border-white/10"
              >
                <img src={o.items[0].image} alt="" className="h-14 w-11 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold dark:text-white">#{o.id}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                    {o.items.map((i) => i.name).join(', ')}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${ORDER_STATUS_META[o.status].color}`}>
                  {ORDER_STATUS_META[o.status].label}
                </span>
                <span className="text-sm font-semibold dark:text-white">{formatVND(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  )
}
