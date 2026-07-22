import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Package, ChevronDown, CheckCircle2, Truck, Clock, XCircle, MapPin } from 'lucide-react'
import { ORDER_STATUS_META, formatVND } from '@/data'
import type { Order } from '@/types'
import { useMyOrders } from '@/hooks/useMyOrders'
import { orderApi } from '@/api/services'
import { useToast } from '@/context/ToastContext'

const TABS = ['Tất cả', 'Đang giao', 'Đã giao', 'Đã hủy'] as const
const TAB_FILTER: Record<string, (o: Order) => boolean> = {
  'Tất cả': () => true,
  'Đang giao': (o) => o.status === 'shipping' || o.status === 'confirmed' || o.status === 'pending',
  'Đã giao': (o) => o.status === 'delivered',
  'Đã hủy': (o) => o.status === 'cancelled',
}

const TIMELINE = [
  { label: 'Đặt hàng', icon: <Clock size={14} /> },
  { label: 'Xác nhận', icon: <CheckCircle2 size={14} /> },
  { label: 'Đang giao', icon: <Truck size={14} /> },
  { label: 'Đã giao', icon: <MapPin size={14} /> },
]

const STATUS_STEP: Record<string, number> = { pending: 0, confirmed: 1, shipping: 2, delivered: 3, cancelled: -1 }

export default function Orders() {
  // UC-14: đơn hàng từ backend, fallback mock
  const { orders } = useMyOrders()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Tất cả')
  const [open, setOpen] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState<string[]>([])
  const { toast } = useToast()

  // UC-15: chỉ hủy được đơn đang chờ xác nhận
  const cancelOrder = (id: string) => {
    setCancelled((c) => [...c, id])
    orderApi
      .cancel(id)
      .then(() => toast('Đã hủy đơn hàng', 'info'))
      .catch(() => toast('Đã hủy (chế độ demo)', 'info'))
  }

  const withCancelled = orders.map((o) =>
    cancelled.includes(o.id) ? { ...o, status: 'cancelled' as const } : o,
  )
  const filtered = withCancelled.filter(TAB_FILTER[tab])

  return (
    <div>
      <h1 className="font-display text-2xl font-medium dark:text-white">Đơn hàng của tôi</h1>
      <p className="mt-2 text-sm text-slate-400">Theo dõi và quản lý các đơn hàng.</p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative shrink-0 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'text-white dark:text-ink' : 'text-slate-500 hover:text-ink dark:hover:text-white'
            }`}
          >
            {tab === t && (
              <motion.span layoutId="order-tab" className="absolute inset-0 rounded-xl bg-ink dark:bg-white" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-card bg-white py-16 text-center shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10">
            <Package size={36} className="text-slate-300" />
            <p className="text-sm text-slate-400">Không có đơn hàng nào.</p>
          </div>
        )}
        {filtered.map((o) => {
          const isOpen = open === o.id
          const step = STATUS_STEP[o.status]
          return (
            <motion.div
              key={o.id}
              layout
              className="overflow-hidden rounded-card bg-white shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10"
            >
              <button
                onClick={() => setOpen(isOpen ? null : o.id)}
                className="flex w-full cursor-pointer flex-wrap items-center gap-4 p-5 text-left"
              >
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((it, i) => (
                    <img key={i} src={it.image} alt="" className="h-13 w-11 rounded-xl border-2 border-white object-cover dark:border-zinc-900" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold dark:text-white">#{o.id}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{o.date} · {o.items.length} sản phẩm · {o.payment}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${ORDER_STATUS_META[o.status].color}`}>
                  {ORDER_STATUS_META[o.status].label}
                </span>
                <span className="font-display text-lg font-semibold dark:text-white">{formatVND(o.total)}</span>
                <ChevronDown size={17} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="border-t border-slate-100 p-6 dark:border-white/5">
                      {/* Timeline */}
                      {o.status !== 'cancelled' ? (
                        <div className="mb-8 flex items-center">
                          {TIMELINE.map((t, i) => (
                            <div key={t.label} className="flex flex-1 items-center last:flex-none">
                              <div className="flex flex-col items-center">
                                <motion.span
                                  initial={{ scale: 0.6, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: i * 0.12 }}
                                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                                    i <= step ? 'bg-success text-white shadow-lg shadow-success/30' : 'bg-slate-100 text-slate-400 dark:bg-white/10'
                                  }`}
                                >
                                  {t.icon}
                                </motion.span>
                                <span className={`mt-2 text-[10px] font-semibold tracking-wider uppercase ${i <= step ? 'text-success' : 'text-slate-400'}`}>
                                  {t.label}
                                </span>
                              </div>
                              {i < TIMELINE.length - 1 && (
                                <div className="mx-2 mb-5 h-0.5 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-white/10">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: i < step ? '100%' : '0%' }}
                                    transition={{ duration: 0.6, delay: i * 0.15 }}
                                    className="h-full bg-success"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-danger/5 p-4 text-sm text-danger">
                          <XCircle size={18} /> Đơn hàng đã bị hủy theo yêu cầu của bạn.
                        </div>
                      )}

                      {/* UC-35: Vận đơn */}
                      {o.shipment && (
                        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-accent/10 px-5 py-3.5 text-sm">
                          <Truck size={16} className="text-accent-dark" />
                          <span className="font-medium dark:text-white">{o.shipment.carrier}</span>
                          <code className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold tracking-wider dark:bg-zinc-800 dark:text-white">
                            {o.shipment.trackingCode}
                          </code>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {o.shipment.status === 'delivered' ? 'Đã giao thành công' : o.shipment.status === 'in_transit' ? 'Đang trên đường giao' : 'Đang chuẩn bị hàng'}
                          </span>
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-3">
                        {o.items.map((it, i) => (
                          <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-3.5 dark:border-white/5">
                            <img src={it.image} alt={it.name} className="h-14 w-11 rounded-xl object-cover" />
                            <div className="flex-1">
                              <p className="text-sm font-medium dark:text-white">{it.name}</p>
                              <p className="text-xs text-slate-400">Size {it.size} × {it.quantity}</p>
                            </div>
                            <span className="text-sm font-semibold dark:text-white">{formatVND(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* UC-15: Hủy đơn khi đang chờ xác nhận */}
                      {o.status === 'pending' && (
                        <div className="mt-5 flex justify-end">
                          <button
                            onClick={() => cancelOrder(o.id)}
                            className="cursor-pointer rounded-btn border border-danger/30 px-5 py-2.5 text-xs font-semibold tracking-widest text-danger uppercase transition-all hover:bg-danger hover:text-white"
                          >
                            Hủy đơn hàng
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
