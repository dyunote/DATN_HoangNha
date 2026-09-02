import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

/**
 * HỘP THOẠI XÁC NHẬN dùng chung cho mọi thao tác KHÔNG HOÀN TÁC ĐƯỢC.
 *
 * VÌ SAO CẦN: các nút thùng rác trong khu quản trị (sản phẩm, danh mục,
 * voucher, banner, địa chỉ) gọi thẳng API xóa ngay lúc click — bấm nhầm một
 * cái là mất dữ liệu, không có Ctrl+Z. Hộp thoại này bắt người dùng đọc rõ
 * TÊN đối tượng sắp mất rồi mới cho bấm.
 *
 * Không dùng `window.confirm` vì nó không theo giao diện dự án, không hiện
 * được trạng thái "đang xóa", và bị chặn ở một số trình duyệt/thiết bị.
 */
interface Props {
  open: boolean
  /** Tiêu đề ngắn: "Xóa sản phẩm?" */
  title: string
  /** Mô tả hậu quả — nêu đích danh thứ sắp bị xóa */
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Đang gọi API — khóa cả hai nút để không bấm chồng lên nhau */
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xóa',
  cancelLabel = 'Không, giữ lại',
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="title-card dark:text-white">{title}</h3>
            <div className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{message}</div>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          {/* Nút an toàn đứng trước và là mặc định — bấm vội thì rơi vào nút không phá gì */}
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {loading ? 'Đang xóa…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
