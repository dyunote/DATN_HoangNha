import { useEffect, useState } from 'react'
import { Ticket, Check, Loader2, Search } from 'lucide-react'
import { formatVND } from '@/data'
import { catalogApi, type PublicVoucher } from '@/api/services'
import { apiMessage } from '@/api/error'
import { useCart, type AppliedVoucher } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

/**
 * Lý do một voucher CHƯA dùng được với giỏ hàng hiện tại.
 * Trả `null` = đủ điều kiện.
 *
 * Đây chỉ là kiểm tra để HIỂN THỊ. Khi khách bấm chọn, backend
 * (/vouchers/validate) vẫn kiểm lại toàn bộ điều kiện — kể cả "mỗi khách
 * 1 lần/mã" mà phía client không thể tự biết.
 */
function ineligibleReason(v: PublicVoucher, subtotal: number): string | null {
  if (subtotal < v.minOrder) {
    return `Đơn tối thiểu ${formatVND(v.minOrder)} — cần mua thêm ${formatVND(v.minOrder - subtotal)}`
  }
  if (v.remaining <= 0) return 'Mã đã hết lượt sử dụng'
  return null
}

/** Số tiền ước tính được giảm — chỉ để khách so sánh giữa các mã */
function estimateDiscount(v: PublicVoucher, subtotal: number): string {
  if (v.type === 'percent') return `giảm ~${formatVND(Math.round((subtotal * v.value) / 100))}`
  if (v.type === 'fixed') return `giảm ${formatVND(v.value)}`
  return 'miễn phí vận chuyển'
}

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Danh sách voucher đang khả dụng để khách BẤM CHỌN, thay vì phải nhớ và
 * gõ tay từng mã. Vẫn giữ ô nhập thủ công cho mã bí mật (mã tặng riêng,
 * mã in trên hóa đơn... — những mã không nằm trong danh sách công khai).
 */
export default function VoucherPicker({ open, onClose }: Props) {
  const { subtotal, voucher, setVoucher } = useCart()
  const { toast } = useToast()
  const [list, setList] = useState<PublicVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [manualCode, setManualCode] = useState('')
  /** Mã đang gửi lên server kiểm tra — khóa nút để không bấm hai lần */
  const [applying, setApplying] = useState<string | null>(null)

  // Nạp lại mỗi lần mở: lượt dùng còn lại và danh sách mã đang chạy có thể
  // đã đổi kể từ lần mở trước (admin vừa tạo mã mới, mã vừa hết lượt...).
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setLoadError('')
    catalogApi
      .vouchers()
      .then(setList)
      .catch((err) => setLoadError(apiMessage(err, 'Không tải được danh sách voucher')))
      .finally(() => setLoading(false))
  }, [open])

  /** Gửi mã lên backend kiểm tra rồi áp vào giỏ — KHÔNG tự tính giảm giá ở client */
  const apply = async (code: string) => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setApplying(trimmed)
    try {
      const result = await catalogApi.validateVoucher(trimmed, subtotal)
      const applied: AppliedVoucher = { code: trimmed, type: result.type, discount: result.discount }
      setVoucher(applied)
      toast(`Đã áp dụng mã ${trimmed} 🎉`)
      onClose()
    } catch (err) {
      toast(apiMessage(err, 'Mã giảm giá không hợp lệ'), 'error')
    } finally {
      setApplying(null)
    }
  }

  // Mã đủ điều kiện lên trước — khách thấy ngay cái dùng được
  const sorted = [...list].sort((a, b) => {
    const aBad = ineligibleReason(a, subtotal) ? 1 : 0
    const bBad = ineligibleReason(b, subtotal) ? 1 : 0
    return aBad - bBad
  })

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg" label="Chọn voucher">
      <div className="p-7">
        <h3 className="title-card dark:text-white">Chọn voucher</h3>
        <p className="mt-1 text-sm text-slate-400">
          Tạm tính hiện tại: <span className="font-semibold text-ink dark:text-white">{formatVND(subtotal)}</span>
        </p>

        {/* Ô nhập tay — giữ lại cho mã bí mật không nằm trong danh sách công khai */}
        <div className="mt-5">
          <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">Nhập mã thủ công</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), apply(manualCode))}
                placeholder="Mã bí mật, VD: VIPGOLD20"
                className="w-full rounded-input border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm uppercase outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => apply(manualCode)} disabled={!!applying}>
              Áp dụng
            </Button>
          </div>
        </div>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
          <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Mã đang có</span>
          <span className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
        </div>

        {loading && (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
            <Loader2 size={15} className="animate-spin" /> Đang tải voucher…
          </p>
        )}
        {loadError && <p className="rounded-card bg-danger/10 px-4 py-3 text-sm text-danger">{loadError}</p>}
        {!loading && !loadError && sorted.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">Hiện chưa có voucher nào đang chạy.</p>
        )}

        <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
          {sorted.map((v) => {
            const reason = ineligibleReason(v, subtotal)
            const isApplied = voucher?.code === v.code
            return (
              <button
                key={v.id}
                type="button"
                // Voucher chưa đủ điều kiện VẪN HIỆN (để khách biết mua thêm bao
                // nhiêu thì được giảm) nhưng không bấm chọn được.
                disabled={!!reason || !!applying}
                onClick={() => apply(v.code)}
                className={`flex w-full items-stretch overflow-hidden rounded-card border text-left transition-all ${
                  reason
                    ? 'cursor-not-allowed border-slate-100 opacity-60 dark:border-white/5'
                    : isApplied
                      ? 'cursor-pointer border-success bg-success/5'
                      : 'cursor-pointer border-slate-200 hover:border-accent hover:shadow-lg hover:shadow-accent/10 dark:border-white/10'
                }`}
              >
                {/* Cuống vé — màu theo loại giảm giá, giống thẻ voucher ở trang tài khoản */}
                <div
                  className={`flex w-20 shrink-0 flex-col items-center justify-center gap-1 p-3 text-center ${
                    v.type === 'freeship' ? 'bg-success' : v.type === 'percent' ? 'bg-ink dark:bg-white' : 'bg-accent'
                  }`}
                >
                  <Ticket size={15} className={v.type === 'percent' ? 'text-accent dark:text-accent-dark' : 'text-white/80'} />
                  <p className={`font-display text-base font-bold ${v.type === 'percent' ? 'text-white dark:text-ink' : 'text-white'}`}>
                    {v.discount}
                  </p>
                </div>

                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold tracking-widest dark:bg-white/10 dark:text-white">
                      {v.code}
                    </code>
                    {isApplied && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                        <Check size={12} /> Đang áp dụng
                      </span>
                    )}
                    {applying === v.code && <Loader2 size={12} className="animate-spin text-slate-400" />}
                  </div>
                  <p className="mt-1.5 line-clamp-1 text-sm font-medium dark:text-white">{v.description || estimateDiscount(v, subtotal)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Đơn tối thiểu {formatVND(v.minOrder)} · HSD {v.expiry} · còn {v.remaining} lượt
                  </p>
                  {/* Nói rõ VÌ SAO chưa dùng được, không chỉ làm mờ rồi để khách đoán */}
                  {reason ? (
                    <p className="mt-1.5 text-[11px] font-medium text-danger">{reason}</p>
                  ) : (
                    <p className="mt-1.5 text-[11px] font-medium text-success">{estimateDiscount(v, subtotal)}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex justify-between gap-3">
          {voucher ? (
            <Button
              variant="ghost"
              onClick={() => {
                setVoucher(null)
                toast('Đã bỏ mã giảm giá', 'info')
                onClose()
              }}
            >
              Bỏ mã đang dùng
            </Button>
          ) : (
            <span />
          )}
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  )
}
