import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Megaphone, Settings } from 'lucide-react'
import { NOTIFICATIONS } from '@/data'
import type { Notification } from '@/types'
import { meApi } from '@/api/services'

const ICONS = {
  order: { icon: <Package size={16} />, cls: 'bg-accent/15 text-accent-dark' },
  promo: { icon: <Megaphone size={16} />, cls: 'bg-danger/10 text-danger' },
  system: { icon: <Settings size={16} />, cls: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300' },
}

interface ApiNotification {
  id: number
  title: string
  content: string
  type: 'order' | 'promo' | 'system'
  read: boolean
  createdAt: string
}

export default function Notifications() {
  // UC-22: thông báo từ backend, fallback mock
  const [list, setList] = useState<Notification[]>(NOTIFICATIONS)

  useEffect(() => {
    meApi
      .notifications()
      .then((data: ApiNotification[]) =>
        setList(
          data.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            type: n.type,
            read: n.read,
            time: new Date(n.createdAt).toLocaleString('vi-VN'),
          })),
        ),
      )
      .catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="font-display text-2xl font-medium dark:text-white">Thông báo</h1>
      <p className="mt-2 text-sm text-slate-400">Cập nhật mới nhất về đơn hàng và ưu đãi.</p>

      {/* Timeline */}
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
              <p className="mt-2 text-[10px] tracking-wider text-slate-400 uppercase">{n.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
