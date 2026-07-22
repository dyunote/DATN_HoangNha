import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Clock, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { sepayApi, type SepayInfo } from '@/api/services'
import { useToast } from '@/context/ToastContext'
import { formatVND } from '@/data'
import Button from '@/components/ui/Button'

interface Props {
  orderId: string
  sepay: SepayInfo
  /** Gọi khi backend xác nhận đã nhận được tiền */
  onPaid: () => void
}

/** mm:ss còn lại từ mốc hết hạn */
const formatLeft = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Màn hình chờ chuyển khoản: hiện QR VietQR, đếm ngược, và hỏi backend
 * 3 giây/lần xem tiền đã vào chưa.
 *
 * Vì sao phải hỏi liên tục (polling): tiền vào tài khoản là việc xảy ra ở
 * phía ngân hàng → SePay → backend. Trình duyệt không hề biết, nên phải
 * chủ động hỏi. Cách "xịn" hơn là SSE/WebSocket để server đẩy xuống,
 * nhưng polling 3 giây đủ nhanh cho trải nghiệm thanh toán và đơn giản hơn nhiều.
 */
export default function SepayQrPanel({ orderId, sepay, onPaid }: Props) {
  const { toast } = useToast()
  const [left, setLeft] = useState(() => new Date(sepay.expiresAt).getTime() - Date.now())
  const [expired, setExpired] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  // Giữ callback mới nhất mà không làm effect chạy lại
  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid

  // Đồng hồ đếm ngược — chạy mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      const remain = new Date(sepay.expiresAt).getTime() - Date.now()
      setLeft(remain)
      if (remain <= 0) setExpired(true)
    }, 1000)
    return () => clearInterval(timer)
  }, [sepay.expiresAt])

  // Hỏi backend 3 giây/lần. Dừng hẳn khi đã thanh toán hoặc hết hạn
  // để không gọi API vô ích.
  useEffect(() => {
    if (expired) return
    let stopped = false

    const check = async () => {
      try {
        const data = await sepayApi.status(orderId)
        if (stopped) return
        if (data.status === 'paid') {
          onPaidRef.current()
          return
        }
        if (data.status === 'expired') setExpired(true)
      } catch {
        // Lỗi mạng tạm thời → bỏ qua, lần sau hỏi lại
      }
      if (!stopped) timer = setTimeout(check, 3000)
    }

    let timer = setTimeout(check, 3000)
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [orderId, expired])

  const copy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    toast('Đã sao chép')
    setTimeout(() => setCopied(null), 2000)
  }

  // Nút test khi chưa có tài khoản SePay thật (backend phải bật SEPAY_ALLOW_SIMULATE)
  const simulate = async () => {
    setSimulating(true)
    try {
      const res = await sepayApi.simulate(orderId)
      if (res.success) onPaidRef.current()
      else toast(res.message, 'error')
    } catch {
      toast('Chức năng giả lập đang tắt trên máy chủ', 'error')
    } finally {
      setSimulating(false)
    }
  }

  const row = (label: string, value: string, field: string) => (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold dark:text-white">{value}</span>
        <button
          onClick={() => copy(value, field)}
          className="cursor-pointer rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label={`Sao chép ${label}`}
        >
          {copied === field ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-svh items-center justify-center px-4 pt-20 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md overflow-hidden rounded-card border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="bg-ink px-6 py-5 text-center text-white dark:bg-slate-800">
          <p className="text-xs tracking-wide uppercase opacity-70">Chuyển khoản ngân hàng</p>
          <p className="font-display mt-1 text-3xl font-medium">{formatVND(sepay.amount)}</p>
        </div>

        <div className="p-6">
          {expired ? (
            <div className="py-6 text-center">
              <AlertTriangle size={40} className="mx-auto text-warning" />
              <h2 className="mt-4 text-lg font-semibold dark:text-white">Mã QR đã hết hạn</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Đơn hàng <b>{orderId}</b> vẫn được giữ. Nếu bạn đã chuyển khoản, vui lòng liên hệ hotline để được
                đối soát.
              </p>
            </div>
          ) : (
            <>
              <img
                src={sepay.qrUrl}
                alt="Mã QR chuyển khoản"
                className="mx-auto h-56 w-56 rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Mở app ngân hàng → Quét mã QR → Xác nhận chuyển khoản
              </p>

              <div className="mt-5 rounded-lg bg-slate-50 px-4 dark:bg-slate-800/50">
                {row('Ngân hàng', sepay.bank, 'bank')}
                {row('Số tài khoản', sepay.accountNumber, 'acc')}
                {row('Số tiền', String(sepay.amount), 'amount')}
                {row('Nội dung', sepay.payCode, 'code')}
              </div>

              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" />
                Giữ nguyên nội dung chuyển khoản <b className="text-ink dark:text-white">{sepay.payCode}</b> để hệ
                thống tự động xác nhận. Sai nội dung sẽ phải đối soát thủ công.
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-amber-50 py-3 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-500">
                <Loader2 size={15} className="animate-spin" />
                Đang chờ thanh toán
                <span className="flex items-center gap-1 tabular-nums">
                  <Clock size={13} /> {formatLeft(left)}
                </span>
              </div>

              {/* Nút test — backend tắt SEPAY_ALLOW_SIMULATE thì bấm sẽ báo lỗi */}
              <Button variant="outline" className="mt-3 w-full" onClick={simulate} disabled={simulating}>
                {simulating ? 'Đang xử lý...' : 'Tôi đã chuyển khoản (giả lập để test)'}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
