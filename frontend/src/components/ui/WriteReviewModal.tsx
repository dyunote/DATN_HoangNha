import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { meApi } from '@/api/services'
import { apiMessage } from '@/api/error'
import { useToast } from '@/context/ToastContext'
import Modal from './Modal'
import Button from './Button'

/** Nội dung đánh giá tối thiểu — chặn kiểu gõ "ok" cho có */
export const REVIEW_MIN = 10
export const REVIEW_MAX = 1000

const RATING_LABEL: Record<number, string> = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng',
}

/** Món hàng trong đơn mà khách sắp đánh giá */
export interface ReviewTarget {
  orderId: string
  productId: number
  variantId: number
  name: string
  image: string
  color?: string
  size: string
}

interface Props {
  target: ReviewTarget | null
  onClose: () => void
  /** Gọi sau khi gửi thành công — trang cha đánh dấu món này "đã đánh giá" */
  onDone: (target: ReviewTarget) => void
}

/**
 * Viết đánh giá ngay tại đơn hàng đã nhận.
 *
 * Đánh giá gắn thẳng vào (đơn × biến thể) khách thật sự đã mua, nên không cần
 * hỏi lại "bạn mua màu nào, size nào" — hệ thống đã biết. Backend vẫn kiểm lại
 * toàn bộ điều kiện (đơn phải giao thành công, mỗi đơn đánh giá 1 lần).
 */
export default function WriteReviewModal({ target, onClose, onDone }: Props) {
  const { toast } = useToast()
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [sending, setSending] = useState(false)
  const [touched, setTouched] = useState(false)

  // Mở modal cho món khác → xóa sạch nội dung cũ, tránh gửi nhầm bài của
  // sản phẩm trước đó.
  useEffect(() => {
    if (target) {
      setRating(5)
      setHover(0)
      setContent('')
      setTitle('')
      setTouched(false)
    }
  }, [target])

  const trimmed = content.trim()
  const error =
    trimmed.length === 0
      ? 'Vui lòng nhập nội dung đánh giá'
      : trimmed.length < REVIEW_MIN
        ? `Đánh giá cần ít nhất ${REVIEW_MIN} ký tự (hiện ${trimmed.length})`
        : ''

  const submit = () => {
    setTouched(true)
    if (error || !target) return
    setSending(true)
    meApi
      .addReview({
        productId: target.productId,
        rating,
        title: title.trim() || undefined,
        content: trimmed,
        orderId: target.orderId,
        variantId: target.variantId,
      })
      .then(() => {
        toast('Cảm ơn bạn! Đánh giá sẽ hiển thị sau khi được duyệt ✓')
        onDone(target)
        onClose()
      })
      .catch((err) => toast(apiMessage(err, 'Gửi đánh giá thất bại'), 'error'))
      .finally(() => setSending(false))
  }

  return (
    <Modal open={!!target} onClose={onClose} maxWidth="max-w-lg" label="Viết đánh giá sản phẩm">
      <div className="p-8">
        <h3 className="title-card dark:text-white">Đánh giá sản phẩm</h3>

        {target && (
          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-100 p-3.5 dark:border-white/5">
            <img src={target.image} alt="" className="h-16 w-12 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-medium dark:text-white">{target.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {target.color ? `${target.color} / ` : ''}Size {target.size} · Đơn #{target.orderId}
              </p>
            </div>
          </div>
        )}

        {/* Chấm sao */}
        <div className="mt-6">
          <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">Mức độ hài lòng</label>
          <div className="flex items-center gap-3">
            <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  className="cursor-pointer transition-transform hover:scale-125"
                  aria-label={`${s} sao`}
                >
                  <Star
                    size={26}
                    className={s <= (hover || rating) ? 'fill-accent text-accent' : 'text-slate-300 dark:text-slate-600'}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {RATING_LABEL[hover || rating]}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">
            Tiêu đề <span className="normal-case opacity-70">(không bắt buộc)</span>
          </label>
          <input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Chất vải đẹp, đúng size"
            className="w-full rounded-input border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
          />
        </div>

        <div className="mt-4">
          <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">Nhận xét của bạn</label>
          <textarea
            rows={4}
            value={content}
            maxLength={REVIEW_MAX}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Chất liệu, form dáng, màu sắc so với ảnh, tốc độ giao hàng..."
            className="w-full rounded-input border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
          />
          <div className="mt-1.5 flex justify-between text-[11px]">
            <span className="font-medium text-danger">{touched && error ? error : ''}</span>
            <span className="text-muted tabular-nums">
              {trimmed.length}/{REVIEW_MAX}
            </span>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-muted">
          Đánh giá sẽ hiển thị công khai sau khi được cửa hàng duyệt, kèm nhãn "Đã mua hàng".
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={sending}>
            Để sau
          </Button>
          <Button onClick={submit} disabled={sending || (touched && !!error)}>
            {sending ? 'Đang gửi…' : 'Gửi đánh giá'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
