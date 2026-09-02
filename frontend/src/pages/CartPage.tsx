import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, Trash2, Ticket, ArrowRight, Truck, ChevronRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { formatVND } from '@/data'
import { useProducts } from '@/hooks/useProducts'
import { catalogApi } from '@/api/services'
import { apiMessage } from '@/api/error'
import { FREE_SHIP_THRESHOLD, estimateShipping } from '@/lib/shipping'
import QuantityStepper from '@/components/ui/QuantityStepper'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ProductCard from '@/components/product/ProductCard'
import VoucherPicker from '@/components/checkout/VoucherPicker'
import Reveal from '@/components/ui/Reveal'

export default function CartPage() {
  // Voucher lấy từ CartContext (không phải state riêng của trang này) để trang
  // Thanh toán dùng lại được cùng một mã — xem ghi chú trong CartContext.
  const { items, remove, updateQuantity, subtotal, voucher, setVoucher } = useCart()
  const { toast } = useToast()
  const { products } = useProducts()
  const [code, setCode] = useState('')
  /** Mở danh sách voucher khả dụng — khách bấm chọn thay vì gõ tay */
  const [pickerOpen, setPickerOpen] = useState(false)

  // Số tiền giảm do backend tính — không tự suy ra ở client để tránh lệch với DB
  const discount = voucher?.discount ?? 0
  // Loại voucher do backend trả về. Trước đây freeship bị nhận diện bằng cách
  // so mã với chuỗi 'FREESHIP' — mọi voucher freeship đặt tên khác đều không
  // được miễn ship trên giao diện, dù backend vẫn miễn khi đặt hàng.
  const shipping = estimateShipping(subtotal, 'standard', voucher?.type)
  const total = Math.max(0, subtotal - discount) + (items.length ? shipping : 0)
  const shipProgress = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100)

  // UC-11: voucher do backend kiểm tra và tính tiền giảm
  const applyVoucher = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    try {
      const result = await catalogApi.validateVoucher(trimmed, subtotal)
      setVoucher({ code: trimmed, type: result.type, discount: result.discount })
      toast(`Đã áp dụng mã ${trimmed} 🎉`)
    } catch (err) {
      toast(apiMessage(err, 'Mã giảm giá không hợp lệ'), 'error')
    }
  }

  const recommended = products.filter((p) => p.isBestSeller).slice(0, 4)

  return (
    <div className="pt-16 lg:pt-20">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <Reveal direction="up">
          <h1 className="title-page dark:text-white">
            Giỏ hàng <span className="text-xl text-muted">({items.length} sản phẩm)</span>
          </h1>
        </Reveal>

        {items.length === 0 ? (
          <>
            <EmptyState
              icon={<ShoppingBag size={32} />}
              title="Giỏ hàng của bạn đang trống"
              description="Khám phá các bộ sưu tập của chúng tôi và tìm kiếm những thiết kế dành riêng cho bạn."
              actionLabel="Tiếp tục mua sắm"
              actionTo="/danh-muc"
            />
            <div className="mt-8">
              <h2 className="title-section mb-10 dark:text-white">Có thể bạn sẽ thích</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
                {recommended.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.8fr_1fr]">
            {/* Items table */}
            <div>
              {/* Free ship progress */}
              <div className="mb-8 rounded-card bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10">
                <div className="flex items-center gap-3 text-sm dark:text-white">
                  <Truck size={18} className="text-accent-dark" />
                  {shipping === 0 ? (
                    <span className="font-medium text-success">Bạn được miễn phí vận chuyển! 🎉</span>
                  ) : (
                    <span>
                      Mua thêm <b className="text-accent-dark">{formatVND(FREE_SHIP_THRESHOLD - subtotal)}</b> để được freeship
                    </span>
                  )}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <motion.div
                    animate={{ width: `${shipProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark"
                  />
                </div>
              </div>

              <div className="hidden grid-cols-[2.4fr_1fr_1fr_1fr_40px] gap-4 border-b border-slate-200 pb-4 label-meta font-semibold text-muted md:grid dark:border-white/10">
                <span>Sản phẩm</span>
                <span>Đơn giá</span>
                <span className="text-center">Số lượng</span>
                <span className="text-right">Thành tiền</span>
                <span />
              </div>

              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    className="grid grid-cols-[80px_1fr_32px] items-center gap-4 border-b border-slate-100 py-6 md:grid-cols-[2.4fr_1fr_1fr_1fr_40px] dark:border-white/5"
                  >
                    <div className="flex items-center gap-4 md:col-span-1">
                      <Link to={`/san-pham/${item.product.id}`} className="img-zoom shrink-0 overflow-hidden rounded-2xl">
                        <img src={item.product.images[0]} alt={item.product.name} className="h-24 w-20 object-cover" />
                      </Link>
                      <div className="hidden md:block">
                        <p className="text-sm font-medium dark:text-white">{item.product.name}</p>
                        <p className="mt-1 text-xs text-muted">{item.color} / {item.size}</p>
                      </div>
                    </div>
                    <div className="md:hidden">
                      <p className="text-sm font-medium dark:text-white">{item.product.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.color} / {item.size}</p>
                      <p className="mt-1 text-sm font-semibold dark:text-white">{formatVND(item.unitPrice ?? item.product.price)}</p>
                      <div className="mt-2">
                        <QuantityStepper small value={item.quantity} onChange={(v) => updateQuantity(item.product.id, item.size, item.color, v)} />
                      </div>
                    </div>
                    <span className="hidden text-sm font-medium md:block dark:text-white">{formatVND(item.unitPrice ?? item.product.price)}</span>
                    <div className="hidden justify-center md:flex">
                      <QuantityStepper small value={item.quantity} onChange={(v) => updateQuantity(item.product.id, item.size, item.color, v)} />
                    </div>
                    <span className="hidden text-right text-sm font-semibold md:block dark:text-white">
                      {formatVND((item.unitPrice ?? item.product.price) * item.quantity)}
                    </span>
                    <button
                      onClick={() => { remove(item.product.id, item.size, item.color); toast('Đã xóa sản phẩm khỏi giỏ', 'info') }}
                      className="cursor-pointer justify-self-end text-slate-300 transition-colors hover:text-danger"
                      aria-label="Xóa"
                    >
                      <Trash2 size={17} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Link to="/danh-muc" className="link-underline group mt-8 inline-flex items-center gap-2 text-sm font-semibold dark:text-white">
                ← Tiếp tục mua sắm
              </Link>
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-card bg-white p-7 shadow-xl ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10">
                <h3 className="title-card dark:text-white">Tóm tắt đơn hàng</h3>

                {/* Voucher */}
                <div className="mt-6">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase dark:text-white">
                    <Ticket size={14} className="text-accent-dark" /> Mã giảm giá
                  </p>
                  {/* Cách CHÍNH: bấm chọn từ danh sách mã đang chạy.
                      Ô nhập tay bên dưới giữ lại cho mã bí mật. */}
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="mb-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded-input border border-dashed border-accent/60 bg-accent/5 px-4 py-2.5 text-sm font-semibold text-accent-dark transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    <span className="flex items-center gap-2">
                      <Ticket size={14} /> {voucher ? `Đang dùng mã ${voucher.code}` : 'Chọn voucher có sẵn'}
                    </span>
                    <ChevronRight size={15} />
                  </button>
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="VD: HOANGNHA15"
                      className="min-w-0 flex-1 rounded-input border border-slate-200 px-4 py-2.5 text-sm uppercase outline-none focus:border-accent dark:border-white/15 dark:bg-zinc-800 dark:text-white"
                    />
                    <Button size="sm" variant="outline" onClick={applyVoucher}>Áp dụng</Button>
                  </div>
                  {voucher && (
                    <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-center gap-2 text-xs font-medium text-success">
                      ✓ Đã áp dụng mã {voucher.code}
                      <button
                        type="button"
                        onClick={() => { setVoucher(null); setCode('') }}
                        className="cursor-pointer text-muted underline underline-offset-2 hover:text-danger"
                      >
                        Bỏ mã
                      </button>
                    </motion.p>
                  )}
                </div>

                <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-6 text-sm dark:border-white/10">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Tạm tính</span><span className="font-medium text-ink dark:text-white">{formatVND(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Giảm giá</span><span>-{formatVND(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Phí vận chuyển (ước tính)</span>
                    <span className={shipping === 0 ? 'font-medium text-success' : 'font-medium text-ink dark:text-white'}>
                      {shipping === 0 ? 'Miễn phí' : formatVND(shipping)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-slate-100 pt-4 dark:border-white/10">
                    <span className="font-semibold dark:text-white">Tổng cộng</span>
                    <span className="font-display text-2xl font-semibold dark:text-white">{formatVND(total)}</span>
                  </div>
                  <p className="text-right text-[11px] text-muted">(Đã bao gồm VAT)</p>
                </div>

                <Link to="/thanh-toan" className="mt-6 block">
                  <Button size="lg" className="w-full">
                    Tiến hành thanh toán <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Danh sách voucher khả dụng — chọn xong tự áp dụng và cập nhật tổng tiền */}
      <VoucherPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  )
}
