import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Button from './Button'
import { Link } from 'react-router-dom'

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: ReactNode
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 text-accent-dark"
      >
        {icon}
      </motion.div>
      <h3 className="font-display text-2xl font-medium dark:text-white">{title}</h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="mt-8">
          <Button size="lg">{actionLabel}</Button>
        </Link>
      )}
    </motion.div>
  )
}
