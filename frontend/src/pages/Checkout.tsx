import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  MapPin, Plus, Truck, Zap, Banknote, QrCode, Wallet, CreditCard, ShieldCheck, CheckCircle2, ShoppingBag,
} from 'lucide-react'
import { isAxiosError } from 'axios'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ADDRESSES, formatVND } from '@/data'
import { orderApi, type SepayInfo } from '@/api/services'
import SepayQrPanel from '@/components/checkout/SepayQrPanel'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Reveal from '@/components/ui/Reveal'

const schema = z.object({
  name: z.string().min(2, 'Vui lòng nhập họ tên'),
  phone: z.string().regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const SHIPPING_METHODS = [
  { id: 'standard', icon: <Truck size={18} />, name: 'Giao hàng tiêu chuẩn', time: '3 — 5 ngày', price: 30000 },
  { id: 'express', icon: <Zap size={18} />, name: 'Giao hàng hỏa tốc', time: '1 — 2 ngày', price: 55000 },
]

const PAYMENT_METHODS = [
  { id: 'cod', icon: <Banknote size={20} />, name: 'Thanh toán khi nhận hàng (COD)', desc: 'Kiểm tra hàng trước khi thanh toán' },
  { id: 'vnpay', icon: <CreditCard size={20} />, name: 'VNPay', desc: 'Thẻ ATM / Visa / Master qua cổng VNPay' },
  { id: 'momo', icon: <Wallet size={20} />, name: 'Ví MoMo', desc: 'Thanh toán nhanh qua ví điện tử' },
  { id: 'qr', icon: <QrCode size={20} />, name: 'Chuyển khoản QR (VietQR)', desc: 'Quét mã, hệ thống tự xác nhận trong vài giây' },
]

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [addressId, setAddressId] = useState(ADDRESSES[0]?.id ?? 0)
  const [newAddress, setNewAddress] = useState(false)
  const [shipping, setShipping] = useState('standard')
  const [payment, setPayment] = useState('cod')
  const [placed, setPlaced] = useState(false)
  const [orderId, setOrderId] = useState('HN-24102')
  // Khác null = đang ở màn hình chờ chuyển khoản (đơn đã tạo, chưa nhận tiền)
  const [sepay, setSepay] = useState<SepayInfo | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: 'Trần Duy', phone: '0901234567', email: 'duytran.220218@gmail.com' },
  })

  const shipFee = subtotal >= 500000 && shipping === 'standard' ? 0 : (SHIPPING_METHODS.find((s) => s.id === shipping)?.price ?? 0)
  const total = subtotal + shipFee

  // UC-12: Đặt hàng — bắt buộc đăng nhập, đơn hàng phải được backend ghi nhận thật
  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast('Vui lòng đăng nhập để đặt hàng', 'warning')
      navigate('/dang-nhap', { state: { from: '/thanh-toan' } })
      return
    }

    const addr = ADDRESSES.find((a) => a.id === addressId)
    const addressText = addr
      ? `${addr.street}, ${addr.ward}, ${addr.district}, ${addr.city}`
      : 'Địa chỉ mới nhập tại checkout'
    try {
      const order = await orderApi.create({
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, color: i.color, size: i.size })),
        paymentMethod: payment,
        shippingMethod: shipping,
        receiverName: data.name,
        receiverPhone: data.phone,
        receiverEmail: data.email,
        addressText,
        note: data.note,
      })
      setOrderId(order.id)
      // Chuyển khoản: đơn đã tạo nhưng CHƯA thanh toán → sang màn hình QR,
      // giỏ hàng xóa ngay vì hàng đã được giữ (tồn kho đã trừ)
      if (order.sepay) {
        setSepay(order.sepay)
        clear()
        return
      }
    } catch (err) {
      // KHÔNG bao giờ báo "đặt hàng thành công" khi backend chưa ghi nhận đơn —
      // người dùng sẽ ngồi chờ hàng không bao giờ tới.
      if (isAxiosError(err) && err.response) {
        // 401: phiên hết hạn → đăng nhập lại
        if (err.response.status === 401) {
          toast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'warning')
          navigate('/dang-nhap', { state: { from: '/thanh-toan' } })
          return
        }
        // 400/409: hết hàng, voucher sai... → hiện đúng lý do từ server
        toast(err.response.data?.message ?? 'Đặt hàng thất bại', 'error')
        return
      }
      // Không có response = backend chưa chạy / mất mạng
      toast('Không kết nối được máy chủ. Vui lòng thử lại sau.', 'error')
      return
    }
    setPlaced(true)
    clear()
    toast('Đặt hàng thành công! 🎉')
  }

  // Màn hình chờ chuyển khoản — tự chuyển sang "thành công" khi webhook báo đã nhận tiền
  if (sepay) {
    return (
      <SepayQrPanel
        orderId={orderId}
        sepay={sepay}
        onPaid={() => {
          setSepay(null)
          setPlaced(true)
          toast('Đã nhận được thanh toán! 🎉')
        }}
      />
    )
  }

  if (placed) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-success/10 text-success"
          >
            <CheckCircle2 size={44} />
          </motion.div>
          <h1 className="font-display mt-8 text-3xl font-medium dark:text-white">Đặt hàng thành công!</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Cảm ơn bạn đã tin tưởng Hoàng Nha. Mã đơn hàng <b className="text-accent-dark">{orderId}</b> đã được gửi tới
            email của bạn. Chúng tôi sẽ liên hệ xác nhận trong vòng 24 giờ.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/tai-khoan/don-hang')}>Theo dõi đơn hàng</Button>
            <Button onClick={() => navigate('/danh-muc')}>Tiếp tục mua sắm</Button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="pt-20">
        <EmptyState
          icon={<ShoppingBag size={32} />}
          title="Chưa có sản phẩm để thanh toán"
          description="Hãy thêm sản phẩm vào giỏ hàng trước khi tiến hành thanh toán."
          actionLabel="Mua sắm ngay"
          actionTo="/danh-muc"
        />
      </div>
    )
  }

  return (
    <div className="pt-16 lg:pt-20">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <Reveal direction="up">
          <h1 className="font-display text-4xl font-medium lg:text-5xl dark:text-white">Thanh toán</h1>
          <p className="mt-3 text-sm text-slate-400">
            <Link to="/gio-hang" className="hover:text-ink dark:hover:text-white">Giỏ hàng</Link> · <span className="text-ink dark:text-white">Thanh toán</span>
          </p>
        </Reveal>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-10">
            {/* Address book */}
            <Reveal direction="up">
              <section>
                <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold tracking-[0.18em] uppercase dark:text-white">
                  <MapPin size={16} className="text-accent-dark" /> Địa chỉ nhận hàng
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {ADDRESSES.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => { setAddressId(a.id); setNewAddress(false) }}
                      className={`cursor-pointer rounded-card border-2 p-5 text-left transition-all duration-300 ${
                        addressId === a.id && !newAddress
                          ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                          : 'border-slate-200 hover:border-slate-300 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase dark:bg-white dark:text-ink">
                          {a.label}
                        </span>
                        {a.isDefault && <span className="text-[10px] font-semibold text-accent-dark uppercase">Mặc định</span>}
                      </div>
                      <p className="mt-3 text-sm font-semibold dark:text-white">{a.name} · {a.phone}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {a.street}, {a.ward}, {a.district}, {a.city}
                      </p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewAddress(true)}
                    className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed transition-all ${
                      newAddress ? 'border-accent bg-accent/5 text-accent-dark' : 'border-slate-300 text-slate-400 hover:border-accent hover:text-accent-dark dark:border-white/15'
                    }`}
                  >
                    <Plus size={22} />
                    <span className="text-xs font-semibold tracking-widest uppercase">Thêm địa chỉ mới</span>
                  </button>
                </div>

                <AnimatePresence>
                  {newAddress && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 grid gap-4 rounded-card bg-slate-50 p-6 sm:grid-cols-2 dark:bg-white/5">
                        <FormField label="Địa chỉ" placeholder="Số nhà, tên đường" className="sm:col-span-2" />
                        <FormField label="Tỉnh / Thành phố" placeholder="TP. Hồ Chí Minh" />
                        <FormField label="Quận / Huyện" placeholder="Quận 1" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </Reveal>

            {/* Receiver info */}
            <Reveal direction="up" delay={0.05}>
              <section>
                <h2 className="mb-5 text-sm font-semibold tracking-[0.18em] uppercase dark:text-white">Thông tin người nhận</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Họ và tên" placeholder="Nguyễn Văn A" error={errors.name?.message} {...register('name')} />
                  <FormField label="Số điện thoại" placeholder="0901 234 567" error={errors.phone?.message} {...register('phone')} />
                  <FormField label="Email" type="email" placeholder="ban@email.com" className="sm:col-span-2" error={errors.email?.message} {...register('email')} />
                  <FormField label="Ghi chú (tùy chọn)" placeholder="VD: Giao giờ hành chính" className="sm:col-span-2" {...register('note')} />
                </div>
              </section>
            </Reveal>

            {/* Shipping method */}
            <Reveal direction="up" delay={0.1}>
              <section>
                <h2 className="mb-5 text-sm font-semibold tracking-[0.18em] uppercase dark:text-white">Phương thức vận chuyển</h2>
                <div className="space-y-3">
                  {SHIPPING_METHODS.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setShipping(m.id)}
                      className={`flex w-full cursor-pointer items-center gap-4 rounded-card border-2 p-5 text-left transition-all duration-300 ${
                        shipping === m.id ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300 dark:border-white/10'
                      }`}
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${shipping === m.id ? 'bg-accent text-ink' : 'bg-slate-100 text-slate-500 dark:bg-white/10'}`}>
                        {m.icon}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold dark:text-white">{m.name}</span>
                        <span className="text-xs text-slate-400">Dự kiến {m.time}</span>
                      </span>
                      <span className="text-sm font-semibold dark:text-white">
                        {m.id === 'standard' && subtotal >= 500000 ? <span className="text-success">Miễn phí</span> : formatVND(m.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </Reveal>

            {/* Payment method */}
            <Reveal direction="up" delay={0.15}>
              <section>
                <h2 className="mb-5 text-sm font-semibold tracking-[0.18em] uppercase dark:text-white">Phương thức thanh toán</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPayment(m.id)}
                      className={`relative flex cursor-pointer items-start gap-4 rounded-card border-2 p-5 text-left transition-all duration-300 ${
                        payment === m.id ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300 dark:border-white/10'
                      }`}
                    >
                      {payment === m.id && (
                        <motion.span layoutId="pay-check" className="absolute top-3 right-3 text-accent-dark">
                          <CheckCircle2 size={18} />
                        </motion.span>
                      )}
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${payment === m.id ? 'bg-accent text-ink' : 'bg-slate-100 text-slate-500 dark:bg-white/10'}`}>
                        {m.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold dark:text-white">{m.name}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{m.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </Reveal>
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal direction="right">
              <div className="rounded-card bg-white p-7 shadow-xl ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10">
                <h3 className="font-display text-xl font-medium dark:text-white">Đơn hàng của bạn</h3>
                <div className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-3">
                      <div className="relative shrink-0">
                        <img src={item.product.images[0]} alt={item.product.name} className="h-18 w-14 rounded-xl object-cover" />
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white dark:bg-white dark:text-ink">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="line-clamp-1 text-[13px] font-medium dark:text-white">{item.product.name}</p>
                        <p className="text-xs text-slate-400">{item.color} / {item.size}</p>
                      </div>
                      <span className="text-[13px] font-semibold dark:text-white">{formatVND(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm dark:border-white/10">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Tạm tính</span><span className="font-medium text-ink dark:text-white">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Vận chuyển</span>
                    <span className={shipFee === 0 ? 'font-medium text-success' : 'font-medium text-ink dark:text-white'}>
                      {shipFee === 0 ? 'Miễn phí' : formatVND(shipFee)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-slate-100 pt-4 dark:border-white/10">
                    <span className="font-semibold dark:text-white">Tổng cộng</span>
                    <span className="font-display text-2xl font-semibold dark:text-white">{formatVND(total)}</span>
                  </div>
                </div>
                <Button type="submit" size="lg" className="mt-6 w-full">Đặt hàng</Button>
                <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck size={13} className="text-success" /> Thông tin được mã hóa và bảo mật tuyệt đối
                </p>
              </div>
            </Reveal>
          </div>
        </form>
      </div>
    </div>
  )
}
