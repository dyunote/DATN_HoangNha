import { AlertTriangle } from 'lucide-react'
import Button from './Button'

/**
 * Khối báo lỗi TẢI DỮ LIỆU kèm nút thử lại.
 *
 * VÌ SAO CẦN: trước đây các trang chỉ hiện một dòng chữ đỏ. Muốn gọi lại API,
 * cách duy nhất là F5 cả trang — mất hết bộ lọc, ô tìm kiếm và vị trí đang đọc.
 * Có nút Thử lại thì chỉ gọi lại đúng request bị hỏng.
 *
 * Dùng cho lỗi TẢI. Lỗi của một thao tác (lưu, xóa) vẫn báo bằng toast.
 */
export default function ErrorState({
  message,
  onRetry,
  retrying = false,
  className = '',
}: {
  message: string
  /** Bỏ trống nếu màn hình không có cách gọi lại */
  onRetry?: () => void
  retrying?: boolean
  className?: string
}) {
  return (
    <div
      // role="alert": trình đọc màn hình đọc ngay khi khối này xuất hiện
      role="alert"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-card bg-danger/10 px-5 py-4 ${className}`}
    >
      <p className="flex items-start gap-2.5 text-sm text-danger">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        {message}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} loading={retrying}>
          {retrying ? 'Đang tải lại…' : 'Thử lại'}
        </Button>
      )}
    </div>
  )
}
