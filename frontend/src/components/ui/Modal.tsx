import { type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = 'max-w-4xl',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-card bg-white shadow-2xl dark:bg-zinc-900`}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/80 backdrop-blur transition-all hover:rotate-90 hover:bg-ink hover:text-white dark:bg-zinc-800/80"
              aria-label="Đóng"
            >
              <X size={17} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
