import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { formatVND } from '@/data'
import type { Voucher } from '@/types'
import { adminApi, type ApiVoucher, type VoucherWindow } from '@/api/services'
import { apiMessage } from '@/api/error'
import { PageHeader, Card, Table, Row, Cell } from './shared'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

/**
 * Dòng trong bảng: ngoài các trường hiển thị của Voucher còn giữ giá trị GỐC
 * từ API (`value`, `startLocal`, `endLocal`) để nút Sửa điền lại đúng dữ liệu
 * đang có trong DB, thay vì đoán ngược từ chuỗi đã định dạng.
 */
interface VoucherRow extends Voucher {
  value: number
  /** yyyy-MM-ddTHH:mm — định dạng <input type="datetime-local"> yêu cầu */
  startLocal: string
  endLocal: string
  /** Sắp diễn ra / Đang hoạt động / Hết hạn — backend tính theo giờ server */
  window: VoucherWindow
}

/**
 * ISO (UTC) → chuỗi cho <input type="datetime-local">.
 * Không cắt thẳng `iso.slice(0, 16)` vì như vậy là lấy giờ UTC, admin ở GMT+7
 * nhìn thấy lệch 7 tiếng so với giờ mình vừa nhập.
 */
const toLocalInput = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Chuỗi datetime-local (giờ máy admin) → ISO để gửi lên API */
const toISO = (local: string): string => new Date(local).toISOString()

const WINDOW_META: Record<VoucherWindow, { label: string; color: string }> = {
  upcoming: { label: 'Sắp diễn ra', color: 'bg-blue-500/10 text-blue-500' },
  active: { label: 'Đang hoạt động', color: 'bg-success/10 text-success' },
  expired: { label: 'Hết hạn', color: 'bg-slate-100 text-slate-400 dark:bg-white/10' },
}

const mapVoucher = (v: ApiVoucher): VoucherRow => ({
  id: v.id,
  code: v.code,
  type: v.type,
  discount: v.type === 'percent' ? `${v.value}%` : v.type === 'fixed' ? `${Math.round(v.value / 1000)}K` : 'Freeship',
  description: v.description,
  minOrder: v.minOrder,
  expiry: new Date(v.endDate).toLocaleDateString('vi-VN'),
  used: v.usedCount >= v.usageLimit,
  value: v.value,
  startLocal: toLocalInput(v.startDate),
  endLocal: toLocalInput(v.endDate),
  window: v.window,
})

/**
 * Các ô số dùng kiểu `number | ''` thay vì `number`.
 *
 * LỖI CŨ: `onChange={Number(e.target.value)}` — xóa hết nội dung ô thì
 * `e.target.value` là chuỗi rỗng, `Number('')` ra 0, state quay lại 0 nên ô
 * LUÔN hiện "0" và không tài nào xóa được. Gõ tiếp thì thành "0100".
 * Chuỗi rỗng cho phép ô trống thật sự. (Cùng cách AdminProducts đang dùng.)
 */
interface VoucherForm {
  code: string
  type: string
  value: number | ''
  description: string
  minOrder: number | ''
  /** yyyy-MM-ddTHH:mm cho <input type="datetime-local"> */
  startDate: string
  endDate: string
}

/** Ô trống → '' (giữ ô rỗng), ngược lại ép về số */
const toNum = (v: string): number | '' => (v === '' ? '' : Number(v))

/** Mặc định: chạy từ bây giờ, kéo dài 30 ngày */
const defaultForm = (): VoucherForm => {
  const now = new Date()
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  return {
    code: '', type: 'percent', value: 10, description: '', minOrder: 0,
    startDate: toLocalInput(now.toISOString()),
    endDate: toLocalInput(end.toISOString()),
  }
}

export default function AdminVouchers() {
  // UC-29: voucher thật từ database
  const [list, setList] = useState<VoucherRow[]>([])
  const [editing, setEditing] = useState<VoucherRow | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const { toast } = useToast()

  const reload = () =>
    adminApi
      .vouchers()
      .then((data) => setList(data.map(mapVoucher)))
      .catch((err) => toast(apiMessage(err, 'Không tải được voucher'), 'error'))

  useEffect(() => {
    reload()
  }, [])

  /**
   * Lỗi của ô "Giá trị" theo đúng loại voucher đang chọn.
   * Chuỗi rỗng = hợp lệ. Cùng quy tắc với parseVoucherValue ở backend.
   */
  const valueError = (() => {
    if (form.type === 'freeship') return ''
    // Ô đang trống = người dùng vừa xóa để gõ lại → CHƯA báo đỏ, để lúc bấm Lưu
    // mới nhắc. Báo lỗi ngay khi ô trống làm form nhấp nháy đỏ mỗi lần sửa số.
    if (form.value === '') return ''
    if (!Number.isInteger(form.value)) return 'Phải là số nguyên'
    if (form.type === 'percent') {
      if (form.value < 0) return 'Không được âm'
      if (form.value > 100) return 'Không được quá 100%'
      return ''
    }
    return form.value > 0 ? '' : 'Số tiền giảm phải lớn hơn 0'
  })()

  const save = async () => {
    if (!form.code) {
      toast('Vui lòng nhập mã voucher', 'warning')
      return
    }
    // Chặn ở form submit — không chỉ dựa vào min/max của thẻ input,
    // vì gõ số bằng bàn phím vẫn vượt qua được min/max của trình duyệt.
    if (form.type !== 'freeship' && form.value === '') {
      toast('Vui lòng nhập giá trị giảm giá', 'warning')
      return
    }
    if (valueError) {
      toast(`Giá trị giảm giá không hợp lệ: ${valueError}`, 'warning')
      return
    }
    if (form.minOrder !== '' && form.minOrder < 0) {
      toast('Đơn tối thiểu không được âm', 'warning')
      return
    }
    // Validate khoảng ngày ngay ở form — backend cũng kiểm lại lần nữa
    if (!form.startDate || !form.endDate) {
      toast('Vui lòng chọn ngày bắt đầu và ngày kết thúc', 'warning')
      return
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast('Ngày kết thúc phải sau ngày bắt đầu', 'warning')
      return
    }
    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value) || 0,
      description: form.description,
      // Bỏ trống đơn tối thiểu = không yêu cầu tối thiểu (0đ)
      minOrder: Number(form.minOrder) || 0,
      startDate: toISO(form.startDate),
      endDate: toISO(form.endDate),
    }
    try {
      // Nút "Sửa" trước đây cũng gọi createVoucher → tạo thêm một voucher nữa
      // (hoặc lỗi trùng mã) thay vì cập nhật cái đang có.
      if (editing) await adminApi.updateVoucher(editing.id, payload)
      else await adminApi.createVoucher(payload)
      await reload()
      toast(editing ? 'Đã cập nhật voucher ✓' : 'Đã tạo voucher trong database ✓')
      setOpen(false)
      setEditing(null)
    } catch (err) {
      // Không nhét dòng giả vào bảng nữa: voucher chỉ "trông như" đã tạo cho tới
      // khi tải lại trang là mất, còn admin thì tưởng đã lưu.
      // Giữ form mở để sửa lại rồi gửi tiếp.
      toast(apiMessage(err, editing ? 'Cập nhật voucher thất bại' : 'Tạo voucher thất bại'), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Quản lý voucher"
        subtitle={`${list.filter((v) => v.window === 'active' && !v.used).length} đang hoạt động · ${list.filter((v) => v.window === 'upcoming').length} sắp diễn ra · ${list.filter((v) => v.window === 'expired').length} hết hạn`}
        onAdd={() => { setEditing(null); setForm(defaultForm()); setOpen(true) }}
        addLabel="Tạo voucher"
      />

      <Card>
        <Table head={['Mã', 'Giảm', 'Mô tả', 'Đơn tối thiểu', 'Thời gian áp dụng', 'Trạng thái', '']}>
          {list.map((v) => (
            <Row key={v.id}>
              <Cell>
                <code className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold tracking-widest dark:bg-white/10 dark:text-white">{v.code}</code>
              </Cell>
              <Cell className="font-semibold text-accent-dark">{v.discount}</Cell>
              <Cell className="max-w-56 text-slate-500 dark:text-slate-400">{v.description}</Cell>
              <Cell className="tabular-nums dark:text-white">{formatVND(v.minOrder)}</Cell>
              <Cell className="text-slate-500 dark:text-slate-400">
                <p className="whitespace-nowrap">{new Date(v.startLocal).toLocaleString('vi-VN')}</p>
                <p className="whitespace-nowrap text-[11px] text-slate-400">→ {new Date(v.endLocal).toLocaleString('vi-VN')}</p>
              </Cell>
              <Cell>
                {/* Hết lượt dùng được ưu tiên báo trước, vì mã còn hạn mà hết
                    lượt thì khách vẫn không dùng được. */}
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${v.used ? 'bg-slate-100 text-slate-400 dark:bg-white/10' : WINDOW_META[v.window].color}`}>
                  {v.used ? 'Hết lượt' : WINDOW_META[v.window].label}
                </span>
              </Cell>
              <Cell>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => {
                      setEditing(v)
                      setForm({
                        code: v.code,
                        type: v.type,
                        value: v.value,
                        description: v.description,
                        minOrder: v.minOrder,
                        startDate: v.startLocal,
                        endDate: v.endLocal,
                      })
                      setOpen(true)
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Sửa"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setList((l) => l.filter((x) => x.id !== v.id))
                      adminApi
                        .deleteVoucher(v.id)
                        .then(() => toast('Đã xóa voucher', 'info'))
                        // Server từ chối (voucher đã gắn với đơn hàng) → trả dòng về bảng
                        .catch((err) => {
                          reload()
                          toast(apiMessage(err, 'Xóa voucher thất bại'), 'error')
                        })
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-danger/10 hover:text-danger"
                    aria-label="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Cell>
            </Row>
          ))}
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} maxWidth="max-w-md">
        <div className="p-8">
          <h3 className="title-card mb-6 dark:text-white">{editing ? 'Sửa voucher' : 'Tạo voucher mới'}</h3>
          <div className="space-y-4">
            <FormField label="Mã voucher" placeholder="SUMMER20" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">Loại giảm</label>
                <select
                  value={form.type}
                  // Đổi từ "Số tiền" (vd 100000) sang "Phần trăm" mà giữ nguyên
                  // giá trị là thành "giảm 100000%" — kéo về trần 100 luôn.
                  onChange={(e) => {
                    const type = e.target.value
                    setForm((f) => ({
                      ...f,
                      type,
                      // Ô trống thì để nguyên trống, đừng tự điền số vào
                      value: type === 'percent' && f.value !== '' ? Math.min(100, Math.max(0, f.value)) : f.value,
                    }))
                  }}
                  className="w-full cursor-pointer rounded-input border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền (đ)</option>
                  <option value="freeship">Miễn phí ship</option>
                </select>
              </div>
              {/* percent: 0–100 · fixed: > 0 · freeship: không dùng tới giá trị.
                  min/max/step ở đây chỉ là hàng rào đầu tiên — form submit và
                  backend đều kiểm lại (xem lib/voucher.ts). */}
              {form.type === 'freeship' ? (
                <div>
                  <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">Giá trị</label>
                  <p className="rounded-input border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-400 dark:border-white/10 dark:bg-white/5">
                    Miễn phí vận chuyển
                  </p>
                </div>
              ) : (
                <FormField
                  label={form.type === 'percent' ? 'Giá trị (%)' : 'Giá trị (đ)'}
                  type="number"
                  min={form.type === 'percent' ? 0 : 1}
                  max={form.type === 'percent' ? 100 : undefined}
                  step={1}
                  value={form.value}
                  error={valueError || undefined}
                  onChange={(e) => setForm((f) => ({ ...f, value: toNum(e.target.value) }))}
                />
              )}
            </div>
            <FormField
              label="Đơn tối thiểu (đ)"
              type="number"
              min={0}
              step={1000}
              value={form.minOrder}
              placeholder="0 = không yêu cầu"
              error={form.minOrder !== '' && form.minOrder < 0 ? 'Không được âm' : undefined}
              onChange={(e) => setForm((f) => ({ ...f, minOrder: toNum(e.target.value) }))}
            />
            {/* Khoảng thời gian chạy chương trình — ngoài khoảng này backend từ chối áp mã */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Bắt đầu"
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              <FormField
                label="Kết thúc"
                type="datetime-local"
                value={form.endDate}
                // Trình duyệt tự chặn chọn trước ngày bắt đầu; backend vẫn kiểm lại
                min={form.startDate}
                error={form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate) ? 'Phải sau ngày bắt đầu' : undefined}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <FormField label="Mô tả" placeholder="VD: Giảm 20% toàn bộ đơn hàng" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save} disabled={!!valueError}>{editing ? 'Cập nhật' : 'Tạo voucher'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
