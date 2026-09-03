import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, Truck, Clock, MapPin, Lock, PackageCheck } from 'lucide-react'
import { ORDER_STATUS_META, formatVND } from '@/data'
import type { Order } from '@/types'
import { adminApi, mapApiOrder } from '@/api/services'
import { apiMessage } from '@/api/error'
import { PageHeader, SearchBox, Card, Table, Row, Cell } from './shared'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import ErrorState from '@/components/ui/ErrorState'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'
import CancelOrderModal from '@/components/ui/CancelOrderModal'
import { NEXT_STATUS, STATUS_STEP, isLockedForEdit } from '@/lib/orderStatus'
import { useDismissable } from '@/hooks/useDismissable'
import { usePageTitle } from '@/hooks/usePageTitle'

// Máy trạng thái dùng chung ở @/lib/orderStatus (khớp backend/src/lib/orderStatus.ts).
// Backend VẪN kiểm lại: dropdown chỉ là gợi ý giao diện, không phải hàng rào.
const TIMELINE = [
  { label: 'Đặt hàng', icon: <Clock size={13} /> },
  { label: 'Xác nhận', icon: <CheckCircle2 size={13} /> },
  { label: 'Chuẩn bị', icon: <PackageCheck size={13} /> },
  { label: 'Đang giao', icon: <Truck size={13} /> },
  { label: 'Giao thành công', icon: <MapPin size={13} /> },
]

export default function AdminOrders() {
  usePageTitle('Quản lý đơn hàng · Quản trị')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const { toast } = useToast()

  // UC-27: đơn hàng thật từ database (cần đăng nhập admin)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [confirming, setConfirming] = useState(false)
  /** Đơn admin đang định hủy — mở modal nhập lý do trước khi gọi API */
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const [cancelling, setCancelling] = useState(false)
  // Esc để đóng, Tab chạy vòng trong ngăn kéo, trang nền không cuộn theo
  const drawerRef = useDismissable<HTMLElement>(!!selected, () => setSelected(null))

  const load = async () => {
    setLoadError('')
    try {
      const list = await adminApi.orders()
      setOrders(list.map(mapApiOrder))
    } catch (err) {
      setLoadError(apiMessage(err, 'Không tải được đơn hàng'))
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Gọi lại đúng request bị hỏng, không phải F5 cả trang */
  const retry = async () => {
    setRetrying(true)
    await load()
    setRetrying(false)
  }

  const changeStatus = (id: string, status: Order['status']) => {
    // Hủy đơn KHÔNG đi đường này: phải nhập lý do trước (modal xác nhận).
    if (status === 'cancelled') {
      const target = orders.find((o) => o.id === id)
      if (target) setCancelTarget(target)
      return
    }
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
        toast(apiMessage(err, 'Cập nhật thất bại'), 'error')
      })
  }

  /** Admin xác nhận hủy kèm lý do — đợi server OK rồi mới đổi giao diện */
  const confirmCancelOrder = (reason: string) => {
    const id = cancelTarget?.id
    if (!id) return
    setCancelling(true)
    adminApi
      .updateOrderStatus(id, 'cancelled', reason)
      .then(() => {
        const patch = { status: 'cancelled' as const, cancelReason: reason, cancelledBy: 'admin' as const }
        setOrders((l) => l.map((o) => (o.id === id ? { ...o, ...patch } : o)))
        setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s))
        setCancelTarget(null)
        toast('Đã hủy đơn hàng — tồn kho và voucher đã hoàn lại ✓')
      })
      .catch((err) => toast(apiMessage(err, 'Hủy đơn thất bại'), 'error'))
      .finally(() => setCancelling(false))
  }

  // Đối soát thủ công: khách chuyển khoản nhưng SỬA nội dung nên webhook SePay
  // không khớp được pay_code → đơn kẹt ở "chưa trả". Trước đây API
  // /admin/orders/:id/confirm-payment đã có nhưng KHÔNG màn hình nào gọi tới,
  // admin không có cách nào xác nhận ngoài việc sửa tay trong phpMyAdmin.
  const confirmPayment = (id: string) => {
    setConfirming(true)
    adminApi
      .confirmPaymentManually(id)
      .then(() => {
        const patch = { paymentStatus: 'paid' as const, status: 'confirmed' as const }
        setOrders((l) => l.map((o) => (o.id === id ? { ...o, ...patch } : o)))
        setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s))
        toast('Đã xác nhận nhận được tiền ✓')
      })
      .catch((err) => toast(apiMessage(err, 'Xác nhận thất bại'), 'error'))
      .finally(() => setConfirming(false))
  }

  const filtered = orders.filter(
    (o) => o.id.toLowerCase().includes(q.toLowerCase()) || (o.customer ?? '').toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div>
      {/* Text cũ ghi "trong tháng" nhưng con số là TỔNG mọi đơn từ trước tới nay */}
      <PageHeader title="Quản lý đơn hàng" subtitle={`${orders.length} đơn hàng`}>
        <SearchBox value={q} onChange={setQ} placeholder="Tìm mã đơn, khách..." />
      </PageHeader>

      {loadError && <ErrorState message={loadError} onRetry={retry} retrying={retrying} className="mb-4" />}

      <Card>
        {/* Ở điện thoại chỉ giữ Mã đơn · Tổng tiền · Trạng thái · nút Chi tiết —
            đủ để tìm và mở đơn; phần còn lại xem trong ngăn kéo chi tiết. */}
        <Table
          head={[
            'Mã đơn',
            { label: 'Khách hàng', className: 'hidden sm:table-cell' },
            { label: 'Ngày đặt', className: 'hidden lg:table-cell' },
            { label: 'Thanh toán', className: 'hidden lg:table-cell' },
            'Tổng tiền',
            'Trạng thái',
            '',
          ]}
        >
          {loading && <TableRowsSkeleton cols={7} />}
          {filtered.map((o) => (
            <Row key={o.id}>
              <Cell className="font-semibold dark:text-white">#{o.id}</Cell>
              <Cell className="hidden sm:table-cell dark:text-white">{o.customer}</Cell>
              <Cell className="hidden text-slate-500 lg:table-cell dark:text-slate-400">{o.date}</Cell>
              <Cell className="hidden text-slate-500 lg:table-cell dark:text-slate-400">
                {o.payment}
                {/* Trước đây ô này tự chế màu amber, lệch với `warning` mà mọi
                    chỗ khác đang dùng cho ý "đang chờ". */}
                {o.paymentMethod === 'qr' && (
                  <Badge tone={o.paymentStatus === 'paid' ? 'success' : 'warning'} className="ml-2">
                    {o.paymentStatus === 'paid' ? 'đã trả' : 'chưa trả'}
                  </Badge>
                )}
              </Cell>
              <Cell className="font-medium tabular-nums dark:text-white">{formatVND(o.total)}</Cell>
              <Cell>
                <Badge className={ORDER_STATUS_META[o.status].color}>{ORDER_STATUS_META[o.status].label}</Badge>
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
        {!loading && !loadError && filtered.length === 0 && (
          <p className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400">
            {orders.length === 0 ? 'Chưa có đơn hàng nào.' : `Không có đơn nào khớp “${q}”.`}
          </p>
        )}
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
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Chi tiết đơn hàng ${selected.id}`}
              tabIndex={-1}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-[85] flex w-full max-w-lg flex-col bg-white shadow-2xl outline-none dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5 dark:border-white/5">
                <div>
                  <h3 className="title-card dark:text-white">#{selected.id}</h3>
                  <p className="text-xs text-muted">{selected.date} · {selected.customer}</p>
                </div>
                <button onClick={() => setSelected(null)} className="cursor-pointer text-muted hover:text-ink dark:hover:text-white" aria-label="Đóng">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-7 py-6">
                {/* Timeline — chỉ vẽ khi đơn còn nằm trên luồng chính.
                    Hủy / giao thất bại / hoàn trả có khung cảnh báo riêng. */}
                {STATUS_STEP[selected.status] >= 0 ? (
                  <div className="mb-8 flex items-center">
                    {TIMELINE.map((t, i) => {
                      const step = STATUS_STEP[selected.status]
                      return (
                        <div key={t.label} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${i <= step ? 'bg-success text-white' : 'bg-slate-100 text-muted dark:bg-white/10'}`}>
                              {t.icon}
                            </span>
                            <span className={`mt-1.5 text-[9px] font-semibold tracking-wider uppercase ${i <= step ? 'text-success' : 'text-muted'}`}>
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
                  <div
                    className={`mb-6 rounded-2xl p-4 text-sm ${
                      selected.status === 'cancelled'
                        ? 'bg-danger/5 text-danger'
                        : selected.status === 'returned'
                          ? 'bg-purple-500/5 text-purple-600 dark:text-purple-400'
                          : 'bg-orange-500/5 text-orange-600'
                    }`}
                  >
                    {selected.status === 'cancelled' ? (
                      <>
                        <p className="font-semibold">
                          Đơn hàng đã bị hủy
                          {selected.cancelledBy === 'admin' ? ' bởi quản trị viên' : selected.cancelledBy === 'user' ? ' bởi khách hàng' : ''}.
                        </p>
                        <p className="mt-1.5 text-xs">
                          <span className="font-semibold">Lý do:</span>{' '}
                          {selected.cancelReason || 'không ghi nhận (đơn hủy trước khi hệ thống lưu lý do)'}
                        </p>
                        {selected.cancelledAt && (
                          <p className="mt-1 text-xs opacity-80">
                            Thời điểm hủy: {new Date(selected.cancelledAt).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </>
                    ) : selected.status === 'returned' ? (
                      <p className="font-semibold">Đơn hàng đã được hoàn/trả — tồn kho và voucher đã hoàn lại.</p>
                    ) : (
                      <p className="font-semibold">
                        Giao hàng không thành công. Chọn "Đang giao" để giao lại, hoặc hủy đơn để hoàn kho.
                      </p>
                    )}
                  </div>
                )}

                {/* Đối soát thanh toán chuyển khoản */}
                {selected.paymentMethod === 'qr' && selected.status !== 'cancelled' && (
                  <div className="mb-6 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold dark:text-white">Chuyển khoản QR</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {selected.paymentStatus === 'paid'
                            ? 'Đã nhận đủ tiền — hệ thống tự khớp qua SePay hoặc admin xác nhận tay.'
                            : 'Chưa nhận được tiền. Nếu khách đã chuyển nhưng sai nội dung, kiểm tra sao kê rồi xác nhận tay.'}
                        </p>
                      </div>
                      {selected.paymentStatus === 'paid' ? (
                        <Badge tone="success" className="shrink-0">Đã thanh toán</Badge>
                      ) : (
                        <Button size="sm" onClick={() => confirmPayment(selected.id)} disabled={confirming}>
                          {confirming ? 'Đang lưu…' : 'Xác nhận đã nhận tiền'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Update status — chỉ hiện các trạng thái CHUYỂN TIẾP hợp lệ */}
                <div className="mb-6">
                  <p className="label-section mb-2 text-slate-500 dark:text-slate-400">Cập nhật trạng thái</p>
                  {/* Đơn đã rời kho thì KHÓA sửa sản phẩm/địa chỉ — nói rõ cho
                      admin biết vì sao không có nút sửa, thay vì để họ đi tìm. */}
                  {isLockedForEdit(selected.status) && (
                    <p className="mb-2 flex items-start gap-2 rounded-input bg-slate-50 px-3 py-2.5 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                      <Lock size={13} className="mt-0.5 shrink-0" />
                      Đơn đã rời kho — không sửa được sản phẩm hay địa chỉ giao hàng nữa.
                    </p>
                  )}
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
                <p className="label-section mb-3 text-slate-500 dark:text-slate-400">Sản phẩm</p>
                <div className="space-y-3">
                  {selected.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-3.5 dark:border-white/5">
                      {/* Nền xám giữ chỗ trong lúc ảnh tải, không để ô trắng trơn */}
                      <img src={it.image} alt="" loading="lazy" className="h-14 w-11 rounded-xl bg-slate-100 object-cover dark:bg-white/5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium dark:text-white">{it.name}</p>
                        <p className="text-xs text-muted">
                          {it.color ? `${it.color} / ` : ''}Size {it.size} × {it.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums dark:text-white">{formatVND(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Invoice summary */}
                <div className="mt-6 space-y-2.5 rounded-2xl bg-slate-50 p-5 text-sm dark:bg-white/5">
                  {/* Số tiền lấy từ DB. Trước đây phí ship bị gán cứng 30.000đ và
                      tạm tính suy ngược ra từ tổng → sai với đơn freeship / có voucher. */}
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Tạm tính</span><span className="tabular-nums">{formatVND(selected.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Vận chuyển</span><span className="tabular-nums">{formatVND(selected.shippingFee)}</span>
                  </div>
                  {selected.discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Giảm giá</span><span className="tabular-nums">−{formatVND(selected.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2.5 font-semibold dark:border-white/10 dark:text-white">
                    <span>Tổng cộng</span><span className="tabular-nums">{formatVND(selected.total)}</span>
                  </div>
                  <p className="text-xs text-muted">Thanh toán qua {selected.payment}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 px-7 py-5 dark:border-white/5">
                {/* Đổi trạng thái đã lưu ngay lúc chọn, nút này không lưu thêm gì —
                    trước đây nó báo "Đã lưu thay đổi ✓" cho một hành động không tồn tại. */}
                <Button size="sm" onClick={() => setSelected(null)}>Đóng</Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Hủy đơn phía admin cũng phải ghi lý do — khách sẽ đọc được lý do này */}
      <CancelOrderModal
        open={!!cancelTarget}
        orderId={cancelTarget?.id ?? ''}
        role="admin"
        submitting={cancelling}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancelOrder}
      />
    </div>
  )
}
