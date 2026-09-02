import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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

/**
 * Thời gian hiển thị theo mức độ.
 *
 * Trước đây mọi thông báo đều tắt sau 3,5 giây. Thông báo lỗi của backend
 * thường dài ("Mã đã được dùng 47 lượt — giới hạn không thể nhỏ hơn con số
 * này") nên đọc chưa xong đã biến mất. Lỗi cần lâu hơn hẳn tin báo thành công.
 */
const DURATION: Record<ToastType, number> = {
  success: 3500,
  info: 3500,
  warning: 5000,
  error: 7000,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  // Hẹn giờ tắt của từng thông báo — giữ ở ref để tạm dừng/chạy lại được
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(id)
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const schedule = useCallback(
    (id: number, ms: number) => {
      const old = timers.current.get(id)
      if (old) window.clearTimeout(old)
      timers.current.set(id, window.setTimeout(() => dismiss(id), ms))
    },
    [dismiss],
  )

  /** Tạm dừng đếm giờ khi người dùng rê chuột / focus vào để đọc */
  const pause = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, type, message }])
      schedule(id, DURATION[type])
    },
    [schedule],
  )

  // Rời trang khi vẫn còn thông báo chờ tắt → dọn hẹn giờ, tránh gọi setState
  // trên component đã gỡ.
  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((t) => window.clearTimeout(t))
      map.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/*
        aria-live: trình đọc màn hình ĐỌC LÊN thông báo khi nó xuất hiện.
        Thiếu thuộc tính này thì mọi tin "Đặt hàng thành công" / "Lưu thất bại"
        đều im lặng với người khiếm thị — họ không biết thao tác vừa rồi ra sao.
      */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed top-24 right-4 z-[100] flex flex-col gap-3 sm:right-6"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              // Lỗi dùng role="alert" để được đọc ngay, không phải chờ đọc xong câu đang dở
              role={t.type === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              // Rê chuột hoặc Tab vào để đọc → dừng đếm giờ; rời ra thì đếm lại
              onMouseEnter={() => pause(t.id)}
              onMouseLeave={() => schedule(t.id, DURATION[t.type])}
              onFocus={() => pause(t.id)}
              onBlur={() => schedule(t.id, DURATION[t.type])}
              className="glass pointer-events-auto flex w-[300px] items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl sm:w-[340px]"
            >
              {ICONS[t.type]}
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="cursor-pointer text-slate-500 transition-colors hover:text-ink dark:text-slate-400 dark:hover:text-white"
                aria-label="Đóng thông báo"
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
