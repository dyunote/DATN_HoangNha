import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

/** Tối thiểu 10 ký tự — PHẢI khớp CANCEL_REASON_MIN ở backend/src/lib/orderActions.ts */
export const CANCEL_REASON_MIN = 10
export const CANCEL_REASON_MAX = 500

/**
 * Lý do phổ biến để khách/admin bấm chọn nhanh thay vì tự gõ.
 * Mọi mục đều dài hơn 10 ký tự nên chọn xong là gửi được ngay.
 * Riêng "Khác" mở ô nhập tự do.
 */
const COMMON_REASONS = [
  'Tôi muốn thay đổi sản phẩm / size / màu',
  'Tôi đặt nhầm sản phẩm',
  'Tôi tìm được giá tốt hơn ở nơi khác',
  'Thời gian giao hàng quá lâu',
  'Tôi không còn nhu cầu mua nữa',
] as const

const ADMIN_REASONS = [
  'Hết hàng, không đủ tồn kho để giao',
  'Không liên hệ được với khách hàng',
  'Khách hàng yêu cầu hủy qua hotline',
  'Địa chỉ giao hàng không hợp lệ',
  'Nghi ngờ đơn hàng ảo / spam',
] as const

const OTHER = 'other'

interface Props {
  open: boolean
  onClose: () => void
  /** Mã đơn hiển thị trên tiêu đề */
  orderId: string
  /** 'admin' đổi danh sách gợi ý và câu chữ cho phù hợp phía quản trị */
  role?: 'user' | 'admin'
  /** Đang gửi request — khóa nút để không bấm hai lần */
  submitting?: boolean
  /** Trả về lý do đã hợp lệ (đã trim, >= 10 ký tự) */
  onConfirm: (reason: string) => void
}

export default function CancelOrderModal({ open, onClose, orderId, role = 'user', submitting = false, onConfirm }: Props) {
  const presets = role === 'admin' ? ADMIN_REASONS : COMMON_REASONS
  const [choice, setChoice] = useState<string>(presets[0])
  const [other, setOther] = useState('')
  const [touched, setTouched] = useState(false)

  // Mở lại modal cho đơn khác → xóa sạch lựa chọn cũ, tránh gửi nhầm lý do
  // của đơn trước đó.
  useEffect(() => {
    if (open) {
      setChoice(presets[0])
      setOther('')
      setTouched(false)
    }
  }, [open, orderId, presets])

  const reason = (choice === OTHER ? other : choice).trim()
  const error =
    reason.length === 0
      ? 'Vui lòng nhập lý do hủy đơn'
      : reason.length < CANCEL_REASON_MIN
        ? `Lý do hủy phải có ít nhất ${CANCEL_REASON_MIN} ký tự (hiện ${reason.length})`
        : ''

  const submit = () => {
    setTouched(true)
    if (error) return
    onConfirm(reason)
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg" label={`Xác nhận hủy đơn ${orderId}`}>
      <div className="p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h3 className="title-card dark:text-white">Xác nhận hủy đơn #{orderId}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {role === 'admin'
                ? 'Khách hàng sẽ nhận được thông báo kèm lý do bạn ghi dưới đây. Tồn kho và lượt voucher được hoàn lại tự động.'
                : 'Đơn đã hủy không khôi phục được. Tồn kho và mã giảm giá (nếu có) sẽ được hoàn lại.'}
            </p>
          </div>
        </div>

        {/* fieldset + legend: trình đọc màn hình đọc "Lý do hủy" TRƯỚC mỗi lựa
            chọn, nhờ vậy người dùng biết nhóm radio này để làm gì. Trước đây
            chỉ có một <label> mồ côi không trỏ vào đâu cả. */}
        <fieldset className="mt-6 border-0 p-0">
          <legend className="label-field mb-2 block text-slate-500 dark:text-slate-400">Lý do hủy</legend>
          <div className="space-y-2">
            {presets.map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-center gap-3 rounded-input border px-4 py-3 text-sm transition-colors ${
                  choice === r
                    ? 'border-ink bg-ink/5 dark:border-white dark:bg-white/10 dark:text-white'
                    : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:text-white dark:hover:border-white/25'
                }`}
              >
                <input
                  type="radio"
                  name="cancel-reason"
                  className="accent-ink dark:accent-white"
                  checked={choice === r}
                  onChange={() => setChoice(r)}
                />
                {r}
              </label>
            ))}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-input border px-4 py-3 text-sm transition-colors ${
                choice === OTHER
                  ? 'border-ink bg-ink/5 dark:border-white dark:bg-white/10 dark:text-white'
                  : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:text-white dark:hover:border-white/25'
              }`}
            >
              <input
                type="radio"
                name="cancel-reason"
                className="accent-ink dark:accent-white"
                checked={choice === OTHER}
                onChange={() => setChoice(OTHER)}
              />
              Lý do khác
            </label>
          </div>

          {choice === OTHER && (
            <textarea
              rows={3}
              autoFocus
              value={other}
              maxLength={CANCEL_REASON_MAX}
              onChange={(e) => setOther(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={`Mô tả lý do hủy (tối thiểu ${CANCEL_REASON_MIN} ký tự)...`}
              className="mt-3 w-full rounded-input border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
            />
          )}

          {touched && error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
        </fieldset>

        <div className="mt-7 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Không hủy nữa
          </Button>
          <Button variant="danger" onClick={submit} disabled={submitting || (touched && !!error)}>
            {submitting ? 'Đang hủy…' : 'Xác nhận hủy đơn'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
