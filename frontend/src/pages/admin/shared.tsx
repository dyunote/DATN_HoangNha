import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import Button from '@/components/ui/Button'

export function PageHeader({
  title,
  subtitle,
  onAdd,
  addLabel = 'Thêm mới',
  children,
}: {
  title: string
  subtitle: string
  onAdd?: () => void
  addLabel?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-medium dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus size={14} /> {addLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Tìm kiếm...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-52 rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm outline-none transition-all focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
      />
    </div>
  )
}

export function Card({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-card border border-slate-200/60 bg-white dark:border-white/5 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-y border-slate-100 text-[11px] tracking-wider text-slate-400 uppercase dark:border-white/5">
            {head.map((h) => (
              <th key={h} className="px-6 py-3 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/50 dark:border-white/5 dark:hover:bg-white/[0.03]">
      {children}
    </tr>
  )
}

export function Cell({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-6 py-3.5 align-middle ${className}`}>{children}</td>
}
