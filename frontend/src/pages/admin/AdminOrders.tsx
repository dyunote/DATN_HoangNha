import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { isAxiosError } from 'axios'
import { X, Printer, CheckCircle2, Truck, Clock, MapPin } from 'lucide-react'
import { ORDERS, ORDER_STATUS_META, formatVND } from '@/data'
import type { Order } from '@/types'
import { adminApi, mapApiOrder } from '@/api/services'
import { PageHeader, SearchBox, Card, Table, Row, Cell } from './shared'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

const CUSTOMERS = ['Minh Anh', 'Thảo Nguyên', 'Quốc Bảo', 'Lan Chi']
const STATUS_STEP: Record<string, number> = { pending: 0, confirmed: 1, shipping: 2, delivered: 3, cancelled: -1 }

// Máy trạng thái — phải KHỚP với backend (admin.ts). Chỉ tiến, không lùi;
// hủy chỉ khi chưa giao; "đang giao" chỉ được sang "đã giao".
const NEXT_STATUS: Record<string, Order['status'][]> = {
  pending: ['confirmed', 'shipping', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
}
const TIMELINE = [
  { label: 'Đặt hàng', icon: <Clock size={13} /> },
  { label: 'Xác nhận', icon: <CheckCircle2 size={13} /> },
  { label: 'Đang giao', icon: <Truck size={13} /> },
  { label: 'Đã giao', icon: <MapPin size={13} /> },
]

export default function AdminOrders() {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const { toast } = useToast()

  // UC-27: đơn hàng thật từ backend (cần đăng nhập admin), fallback mock
  const [orders, setOrders] = useState<Order[]>(
    ORDERS.map((o, i) => ({ ...o, customer: CUSTOMERS[i % CUSTOMERS.length] })),
  )

  useEffect(() => {
    adminApi.orders().then((list) => setOrders(list.map(mapApiOrder))).catch(() => {})
  }, [])

  const changeStatus = (id: string, status: Order['status']) => {
    const prev = orders.find((o) => o.id === id)?.status
    // Cập nhật lạc quan để UI mượt, nhưng HOÀN TÁC nếu server từ chối
    setOrders((l) => l.map((o) => (o.id === id ? { ...o, status } : o)))
    setSelected((s) => (s && s.id === id ? { ...s, status } : s))
    adminApi
      .updateOrderStatus(id, status)
      .then(() => toast('Đã cập nhật trạng thái đơn hàng ✓'))
      .catch((err) => {
        // Hoàn tác về trạng thái cũ
        if (prev) {
          setOrders((l) => l.map((o) => (o.id === id ? { ...o, status: prev } : o)))
          setSelected((s) => (s && s.id === id ? { ...s, status: prev } : s))
        }
        const msg = isAxiosError(err) && err.response
          ? err.response.data?.message ?? 'Cập nhật thất bại'
          : 'Không kết nối được máy chủ'
        toast(msg, 'error')
      })
  }

  const filtered = orders.filter(
    (o) => o.id.toLowerCase().includes(q.toLowerCase()) || (o.customer ?? '').toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div>
      <PageHeader title="Quản lý đơn hàng" subtitle={`${orders.length} đơn hàng trong tháng`}>
        <SearchBox value={q} onChange={setQ} placeholder="Tìm mã đơn, khách..." />
      </PageHeader>

      <Card>
        <Table head={['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Thanh toán', 'Tổng tiền', 'Trạng thái', '']}>
          {filtered.map((o) => (
            <Row key={o.id}>
              <Cell className="font-semibold dark:text-white">#{o.id}</Cell>
              <Cell className="dark:text-white">{o.customer}</Cell>
              <Cell className="text-slate-500 dark:text-slate-400">{o.date}</Cell>
              <Cell className="text-slate-500 dark:text-slate-400">{o.payment}</Cell>
              <Cell className="font-medium tabular-nums dark:text-white">{formatVND(o.total)}</Cell>
              <Cell>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${ORDER_STATUS_META[o.status].color}`}>
                  {ORDER_STATUS_META[o.status].label}
                </span>
              </Cell>
              <Cell>
                <button
                  onClick={() => setSelected(o)}
                  className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold transition-all hover:border-ink hover:bg-ink hover:text-white dark:border-white/15 dark:text-white"
                >
                  Chi tiết
                </button>
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>

      {/* Order detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-[85] flex w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5 dark:border-white/5">
                <div>
                  <h3 className="font-display text-xl font-medium dark:text-white">#{selected.id}</h3>
                  <p className="text-xs text-slate-400">{selected.date} · {selected.customer}</p>
                </div>
                <button onClick={() => setSelected(null)} className="cursor-pointer text-slate-400 hover:text-ink dark:hover:text-white" aria-label="Đóng">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-7 py-6">
                {/* Timeline */}
                {selected.status !== 'cancelled' ? (
                  <div className="mb-8 flex items-center">
                    {TIMELINE.map((t, i) => {
                      const step = STATUS_STEP[selected.status]
                      return (
                        <div key={t.label} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${i <= step ? 'bg-success text-white' : 'bg-slate-100 text-slate-400 dark:bg-white/10'}`}>
                              {t.icon}
                            </span>
                            <span className={`mt-1.5 text-[9px] font-semibold tracking-wider uppercase ${i <= step ? 'text-success' : 'text-slate-400'}`}>
                              {t.label}
                            </span>
                          </div>
                          {i < TIMELINE.length - 1 && (
                            <div className={`mx-1.5 mb-4 h-0.5 flex-1 rounded ${i < step ? 'bg-success' : 'bg-slate-100 dark:bg-white/10'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mb-6 rounded-2xl bg-danger/5 p-4 text-sm text-danger">Đơn hàng đã bị hủy.</div>
                )}

                {/* Update status — chỉ hiện các trạng thái CHUYỂN TIẾP hợp lệ */}
                <div className="mb-6">
                  <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">Cập nhật trạng thái</p>
                  {NEXT_STATUS[selected.status].length > 0 ? (
                    <select
                      value={selected.status}
                      onChange={(e) => changeStatus(selected.id, e.target.value as Order['status'])}
                      className="w-full cursor-pointer rounded-input border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                    >
                      <option value={selected.status} disabled>
                        {ORDER_STATUS_META[selected.status].label} (hiện tại)
                      </option>
                      {NEXT_STATUS[selected.status].map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-input border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                      Đơn đã ở trạng thái kết thúc ({ORDER_STATUS_META[selected.status].label}) — không thể đổi.
                    </div>
                  )}
                </div>

                {/* Items */}
                <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">Sản phẩm</p>
                <div className="space-y-3">
                  {selected.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-3.5 dark:border-white/5">
                      <img src={it.image} alt="" className="h-14 w-11 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium dark:text-white">{it.name}</p>
                        <p className="text-xs text-slate-400">Size {it.size} × {it.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums dark:text-white">{formatVND(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Invoice summary */}
                <div className="mt-6 space-y-2.5 rounded-2xl bg-slate-50 p-5 text-sm dark:bg-white/5">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Tạm tính</span><span className="tabular-nums">{formatVND(selected.total - 30000)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Vận chuyển</span><span className="tabular-nums">{formatVND(30000)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2.5 font-semibold dark:border-white/10 dark:text-white">
                    <span>Tổng cộng</span><span className="tabular-nums">{formatVND(selected.total)}</span>
                  </div>
                  <p className="text-xs text-slate-400">Thanh toán qua {selected.payment}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 px-7 py-5 dark:border-white/5">
                <Button variant="outline" size="sm" onClick={() => toast('Đang xuất hóa đơn PDF... (demo)', 'info')}>
                  <Printer size={14} /> In hóa đơn
                </Button>
                <Button size="sm" onClick={() => { setSelected(null); toast('Đã lưu thay đổi ✓') }}>Lưu</Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
