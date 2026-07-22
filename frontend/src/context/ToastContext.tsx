import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'info' | 'warning' | 'error'
interface Toast {
  id: number
  type: ToastType
  message: string
}

const ToastContext = createContext<{ toast: (message: string, type?: ToastType) => void }>({
  toast: () => {},
})

const ICONS = {
  success: <CheckCircle2 size={18} className="text-success" />,
  info: <Info size={18} className="text-blue-500" />,
  warning: <AlertTriangle size={18} className="text-warning" />,
  error: <XCircle size={18} className="text-danger" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 sm:right-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="glass flex w-[300px] items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl sm:w-[340px]"
            >
              {ICONS[t.type]}
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="text-slate-400 transition-colors hover:text-ink dark:hover:text-white"
                aria-label="Đóng"
              >
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
