import type { ReactNode } from 'react'

/**
 * Nhãn trạng thái hình viên thuốc.
 *
 * VÌ SAO GOM LẠI: chuỗi class
 * `rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap`
 * đang được chép y hệt ở 5 trang quản trị. Sửa một chỗ là bốn chỗ còn lại lệch.
 *
 * `tone` cho các trạng thái dùng chung; những bảng có bảng màu riêng
 * (vd 8 trạng thái đơn hàng trong `ORDER_STATUS_META`) thì truyền thẳng
 * `className` — hình dạng vẫn thống nhất, chỉ màu là của riêng nó.
 */
type Tone = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral'

const TONES: Record<Tone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  accent: 'bg-accent/15 text-accent-dark',
  neutral: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300',
}

export default function Badge({
  tone,
  className = '',
  children,
}: {
  tone?: Tone
  /** Màu riêng — dùng khi bảng có bộ màu của nó (ORDER_STATUS_META…) */
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
        tone ? TONES[tone] : ''
      } ${className}`}
    >
      {children}
    </span>
  )
}
