import { useRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'outline' | 'ghost' | 'accent' | 'white' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /**
   * Đang gửi request lên server.
   *
   * VÌ SAO CẦN: trước đây nút submit không có trạng thái nào, mạng chậm là
   * người dùng bấm tiếp lần hai — với nút "Đặt hàng" thì thành hai đơn thật,
   * trừ kho hai lần. Bật cờ này thì nút TỰ khóa + hiện spinner, không phải
   * mỗi trang tự nhớ viết `disabled`.
   */
  loading?: boolean
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-ink text-white hover:bg-black hover:shadow-xl hover:shadow-ink/20 dark:bg-white dark:text-ink dark:hover:bg-slate-100',
  outline:
    'border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-white dark:border-white/25 dark:text-white dark:hover:bg-white dark:hover:text-ink',
  ghost: 'text-ink hover:bg-ink/5 dark:text-white dark:hover:bg-white/10',
  accent: 'bg-accent text-ink hover:bg-accent-dark hover:shadow-xl hover:shadow-accent/30',
  white: 'bg-white text-ink hover:bg-slate-100 shadow-lg',
  danger: 'bg-danger/10 text-danger hover:bg-danger hover:text-white',
}

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-9 py-4 text-sm tracking-wide',
}

/** Cỡ spinner khớp với cỡ chữ của từng size nút */
const SPINNER: Record<Size, number> = { sm: 13, md: 15, lg: 16 }

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  onClick,
  ...rest
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  // Đang gửi thì coi như nút bị khóa — không cần trang gọi nhớ truyền cả hai
  const isDisabled = disabled || loading

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Chốt chặn cuối: `disabled` của trình duyệt đã chặn click, nhưng vẫn kiểm
    // lại ở đây phòng trường hợp nút được kích hoạt bằng phím hoặc code.
    if (isDisabled) return

    const btn = ref.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const span = document.createElement('span')
      const size = Math.max(rect.width, rect.height)
      span.className = 'ripple-ink'
      span.style.width = span.style.height = `${size}px`
      span.style.left = `${e.clientX - rect.left - size / 2}px`
      span.style.top = `${e.clientY - rect.top - size / 2}px`
      btn.appendChild(span)
      setTimeout(() => span.remove(), 700)
    }
    onClick?.(e)
  }

  return (
    <button
      ref={ref}
      onClick={handleClick}
      disabled={isDisabled}
      // aria-busy: trình đọc màn hình biết nút đang xử lý chứ không phải hỏng
      aria-busy={loading || undefined}
      className={`relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-btn font-semibold uppercase transition-all duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={SPINNER[size]} className="animate-spin" />}
      {children}
    </button>
  )
}
