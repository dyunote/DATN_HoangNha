import { useRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'accent' | 'white' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
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

export default function Button({ variant = 'primary', size = 'md', className = '', children, onClick, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
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
      className={`relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-btn font-semibold uppercase transition-all duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
