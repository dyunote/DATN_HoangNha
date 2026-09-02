import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Ticket, Copy } from 'lucide-react'
import { formatVND } from '@/data'
import { useToast } from '@/context/ToastContext'
import { catalogApi, type PublicVoucher } from '@/api/services'
import { apiMessage } from '@/api/error'
import { CardListSkeleton } from '@/components/ui/Skeleton'
import ErrorState from '@/components/ui/ErrorState'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function Vouchers() {
  usePageTitle('Voucher của tôi')
  const { toast } = useToast()
  // Voucher còn hạn, lấy từ database
  const [list, setList] = useState<PublicVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retrying, setRetrying] = useState(false)

  const load = async () => {
    setLoadError('')
    try {
      setList(await catalogApi.vouchers())
    } catch (err) {
      setLoadError(apiMessage(err, 'Không tải được voucher'))
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retry = async () => {
    setRetrying(true)
    await load()
    setRetrying(false)
  }

  return (
    <div>
      <h1 className="title-panel dark:text-white">Voucher của tôi</h1>
      <p className="mt-2 text-sm text-muted">Ưu đãi dành riêng cho bạn.</p>

      {loading && <CardListSkeleton count={4} className="mt-8 grid gap-5 md:grid-cols-2" />}
      {loadError && <ErrorState message={loadError} onRetry={retry} retrying={retrying} className="mt-8" />}
      {!loading && !loadError && list.length === 0 && (
        <p className="mt-8 rounded-card bg-white py-12 text-center text-sm text-slate-500 ring-1 ring-slate-100 dark:bg-zinc-900 dark:text-slate-400 dark:ring-white/10">
          Hiện chưa có voucher nào khả dụng.
        </p>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {list.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex overflow-hidden rounded-card bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-900 dark:ring-white/10"
          >
            {/* Left stub */}
            <div className={`relative flex w-28 shrink-0 flex-col items-center justify-center gap-1 p-4 text-center ${
              v.type === 'freeship' ? 'bg-success' : v.type === 'percent' ? 'bg-ink dark:bg-white' : 'bg-accent'
            }`}>
              <Ticket size={18} className={v.type === 'percent' ? 'text-accent dark:text-accent-dark' : 'text-white/80'} />
              <p className={`font-display text-xl font-bold ${v.type === 'percent' ? 'text-white dark:text-ink' : 'text-white'}`}>
                {v.discount}
              </p>
              {/* Perforated edge */}
              <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-paper dark:bg-[#0c0c0d]" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-sm font-semibold dark:text-white">{v.description}</p>
              <p className="mt-1 text-xs text-muted">
                Đơn tối thiểu {formatVND(v.minOrder)} · HSD: {v.expiry}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">Còn {v.remaining} lượt sử dụng</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <code className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold tracking-widest dark:bg-white/10 dark:text-white">
                  {v.code}
                </code>
                <button
                  onClick={() => { navigator.clipboard?.writeText(v.code); toast(`Đã sao chép mã ${v.code}`) }}
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-dark uppercase transition-transform hover:scale-105"
                >
                  <Copy size={13} /> Sao chép
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
