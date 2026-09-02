import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { formatVND } from '@/data'
import type { Voucher } from '@/types'
import { adminApi, type ApiVoucher, type VoucherWindow } from '@/api/services'
import { apiMessage } from '@/api/error'
import { PageHeader, Card, Table, Row, Cell } from './shared'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import ErrorState from '@/components/ui/ErrorState'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks/usePageTitle'

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

/** Màu badge theo giai đoạn — dùng tone chung của <Badge>, không chế màu rời */
const WINDOW_META: Record<VoucherWindow, { label: string; tone: 'info' | 'success' | 'neutral' }> = {
  upcoming: { label: 'Sắp diễn ra', tone: 'info' },
  active: { label: 'Đang hoạt động', tone: 'success' },
  expired: { label: 'Hết hạn', tone: 'neutral' },
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
  usePageTitle('Quản lý voucher · Quản trị')
  // UC-29: voucher thật từ database
  const [list, setList] = useState<VoucherRow[]>([])
  const [editing, setEditing] = useState<VoucherRow | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  /** Đang gửi form lên server — khóa nút Lưu để không tạo hai voucher trùng mã */
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [saving, setSaving] = useState(false)
  /** Voucher admin vừa bấm thùng rác — chờ xác nhận, CHƯA gọi API xóa */
  const [deleteTarget, setDeleteTarget] = useState<VoucherRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  /**
   * Đã bấm Lưu lần nào chưa. Trước khi bấm thì không tô đỏ ô còn trống —
   * form vừa mở mà đã đỏ lòm là gây hoang mang vô cớ.
   */
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  /**
   * Nạp danh sách voucher. Lỗi được GIỮ LẠI trên màn hình (`loadError`) chứ
   * không chỉ toast 3,5 giây rồi biến mất — trước đây API hỏng là bảng trống
   * trơn, admin không phân biệt được "chưa có voucher" với "backend chết".
   */
  const reload = async () => {
    setLoadError('')
    try {
      const data = await adminApi.vouchers()
      setList(data.map(mapVoucher))
    } catch (err) {
      setLoadError(apiMessage(err, 'Không tải được voucher'))
    }
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
    // reload chỉ đọc adminApi (module tĩnh) — chạy đúng một lần khi mở trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Gọi lại đúng request bị hỏng, không phải F5 cả trang */
  const retry = async () => {
    setRetrying(true)
    await reload()
    setRetrying(false)
  }

  /**
   * Lỗi của ô "Giá trị" theo đúng loại voucher đang chọn.
   * Chuỗi rỗng = hợp lệ. Cùng quy tắc với parseVoucherValue ở backend.
   */
  /**
   * Toàn bộ lỗi của form, tính lại mỗi lần render.
   * Chuỗi rỗng = ô hợp lệ. Cùng bộ quy tắc với `lib/voucher.ts` ở backend —
   * backend VẪN kiểm lại, form chỉ là hàng rào đầu tiên.
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

  const errors = {
    code: !form.code.trim() ? 'Vui lòng nhập mã voucher' : '',
    // Ô trống chỉ báo sau khi đã bấm Lưu; sai giá trị thì báo ngay
    value:
      valueError || (form.type !== 'freeship' && form.value === '' ? 'Vui lòng nhập giá trị giảm giá' : ''),
    minOrder: form.minOrder !== '' && form.minOrder < 0 ? 'Không được âm' : '',
    endDate: !form.startDate || !form.endDate
      ? 'Vui lòng chọn ngày bắt đầu và ngày kết thúc'
      : new Date(form.endDate) <= new Date(form.startDate)
        ? 'Phải sau ngày bắt đầu'
        : '',
  }
  const hasError = Object.values(errors).some(Boolean)

  const save = async () => {
    // Bật cờ để các ô còn thiếu được tô đỏ kèm lý do NGAY DƯỚI Ô,
    // thay vì bắn toast rồi để admin tự đoán ô nào sai.
    setSubmitted(true)
    if (hasError) return

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
    setSaving(true)
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
    } finally {
      setSaving(false)
    }
  }

  /** Xóa thật — chỉ chạy sau khi admin đã xác nhận trong hộp thoại */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.deleteVoucher(deleteTarget.id)
      setList((l) => l.filter((x) => x.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast('Đã xóa voucher', 'info')
    } catch (err) {
      // Server từ chối (voucher đã gắn với đơn hàng) → giữ nguyên bảng
      toast(apiMessage(err, 'Xóa voucher thất bại'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Quản lý voucher"
        subtitle={`${list.filter((v) => v.window === 'active' && !v.used).length} đang hoạt động · ${list.filter((v) => v.window === 'upcoming').length} sắp diễn ra · ${list.filter((v) => v.window === 'expired').length} hết hạn`}
        onAdd={() => { setEditing(null); setForm(defaultForm()); setSubmitted(false); setOpen(true) }}
        addLabel="Tạo voucher"
      />

      {loadError && <ErrorState message={loadError} onRetry={retry} retrying={retrying} className="mb-4" />}

      <Card>
        <Table
          head={[
            'Mã',
            'Giảm',
            { label: 'Mô tả', className: 'hidden xl:table-cell' },
            { label: 'Đơn tối thiểu', className: 'hidden lg:table-cell' },
            { label: 'Thời gian áp dụng', className: 'hidden md:table-cell' },
            'Trạng thái',
            '',
          ]}
        >
          {/* Khi đang tải, `list` rỗng nên chỉ khung xương hiện — bảng không nhảy
              layout lúc dữ liệu về. */}
          {loading && <TableRowsSkeleton cols={7} />}
          {list.map((v) => (
            <Row key={v.id}>
              <Cell>
                <code className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold tracking-widest dark:bg-white/10 dark:text-white">{v.code}</code>
              </Cell>
              <Cell className="font-semibold text-accent-dark">{v.discount}</Cell>
              <Cell className="hidden max-w-56 text-slate-500 xl:table-cell dark:text-slate-400">{v.description}</Cell>
              <Cell className="hidden tabular-nums lg:table-cell dark:text-white">{formatVND(v.minOrder)}</Cell>
              <Cell className="hidden text-slate-500 md:table-cell dark:text-slate-400">
                <p className="whitespace-nowrap">{new Date(v.startLocal).toLocaleString('vi-VN')}</p>
                <p className="whitespace-nowrap text-[11px] text-muted">→ {new Date(v.endLocal).toLocaleString('vi-VN')}</p>
              </Cell>
              <Cell>
                {/* Hết lượt dùng được ưu tiên báo trước, vì mã còn hạn mà hết
                    lượt thì khách vẫn không dùng được. */}
                <Badge tone={v.used ? 'neutral' : WINDOW_META[v.window].tone}>
                  {v.used ? 'Hết lượt' : WINDOW_META[v.window].label}
                </Badge>
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
                      setSubmitted(false)
                      setOpen(true)
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Sửa"
                  >
                    <Pencil size={14} />
                  </button>
                  {/* Hỏi lại trước khi xóa: trước đây một cú click là mã biến
                      mất khỏi database, không có cách nào lấy lại. */}
                  <button
                    onClick={() => setDeleteTarget(v)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                    aria-label={`Xóa voucher ${v.code}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Cell>
            </Row>
          ))}
        </Table>
        {!loading && !loadError && list.length === 0 && (
          <p className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400">
            Chưa có voucher nào — bấm “Tạo voucher” để thêm mã đầu tiên.
          </p>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} maxWidth="max-w-md" label={editing ? 'Sửa voucher' : 'Tạo voucher mới'}>
        <div className="p-8">
          <h3 className="title-card mb-6 dark:text-white">{editing ? 'Sửa voucher' : 'Tạo voucher mới'}</h3>
          <div className="space-y-4">
            <FormField
              label="Mã voucher"
              placeholder="SUMMER20"
              value={form.code}
              error={submitted ? errors.code || undefined : undefined}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
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
                  <p className="rounded-input border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-muted dark:border-white/10 dark:bg-white/5">
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
                  error={(submitted ? errors.value : valueError) || undefined}
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
              error={errors.minOrder || undefined}
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
                error={(submitted ? errors.endDate : form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate) ? errors.endDate : '') || undefined}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <FormField label="Mô tả" placeholder="VD: Giảm 20% toàn bộ đơn hàng" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button onClick={save} disabled={submitted && hasError} loading={saving}>
              {saving ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Tạo voucher'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa voucher?"
        message={
          <>
            Mã <b className="text-ink dark:text-white">{deleteTarget?.code}</b> sẽ bị xóa khỏi database và
            không khôi phục được. Khách đang giữ mã này sẽ không áp dụng được nữa.
          </>
        }
        confirmLabel="Xóa voucher"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
