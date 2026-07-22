import { motion } from 'framer-motion'
import { Ticket, Copy } from 'lucide-react'
import { VOUCHERS, formatVND } from '@/data'
import { useToast } from '@/context/ToastContext'

export default function Vouchers() {
  const { toast } = useToast()

  return (
    <div>
      <h1 className="font-display text-2xl font-medium dark:text-white">Voucher của tôi</h1>
      <p className="mt-2 text-sm text-slate-400">Ưu đãi dành riêng cho bạn.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {VOUCHERS.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex overflow-hidden rounded-card bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 dark:bg-zinc-900 dark:ring-white/10 ${
              v.used ? 'opacity-50 grayscale' : 'hover:-translate-y-1 hover:shadow-xl'
            }`}
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
              <p className="mt-1 text-xs text-slate-400">Đơn tối thiểu {formatVND(v.minOrder)} · HSD: {v.expiry}</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <code className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold tracking-widest dark:bg-white/10 dark:text-white">
                  {v.code}
                </code>
                {v.used ? (
                  <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Đã dùng</span>
                ) : (
                  <button
                    onClick={() => { navigator.clipboard?.writeText(v.code); toast(`Đã sao chép mã ${v.code}`) }}
                    className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-dark uppercase transition-transform hover:scale-105"
                  >
                    <Copy size={13} /> Sao chép
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
