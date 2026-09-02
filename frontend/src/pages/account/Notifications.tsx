import { motion } from 'framer-motion'
import { Package, Megaphone, Settings } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { usePageTitle } from '@/hooks/usePageTitle'

const ICONS = {
  order: { icon: <Package size={16} />, cls: 'bg-accent/15 text-accent-dark' },
  promo: { icon: <Megaphone size={16} />, cls: 'bg-danger/10 text-danger' },
  system: { icon: <Settings size={16} />, cls: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300' },
}

export default function Notifications() {
  usePageTitle('Thông báo')
  // UC-22: thông báo thật của user, không fallback mock
  const { list, loading } = useNotifications()

  return (
    <div>
      <h1 className="title-panel dark:text-white">Thông báo</h1>
      <p className="mt-2 text-sm text-muted">Cập nhật mới nhất về đơn hàng và ưu đãi.</p>

      {/* Timeline */}
      {!loading && list.length === 0 && (
        <p className="mt-10 rounded-card bg-white py-12 text-center text-sm text-muted ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10">
          Bạn chưa có thông báo nào.
        </p>
      )}

      <div className="relative mt-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-slate-200 dark:before:bg-white/10">
        {list.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex gap-5"
          >
            <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-paper dark:ring-[#0c0c0d] ${ICONS[n.type].cls}`}>
              {ICONS[n.type].icon}
            </span>
            <div className={`flex-1 rounded-card p-5 shadow-sm ring-1 transition-all duration-300 hover:shadow-lg ${
              n.read ? 'bg-white ring-slate-100 dark:bg-zinc-900 dark:ring-white/10' : 'bg-accent/5 ring-accent/30'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold dark:text-white">{n.title}</p>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{n.content}</p>
              <p className="mt-2 text-[10px] tracking-wider text-muted uppercase">{n.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
