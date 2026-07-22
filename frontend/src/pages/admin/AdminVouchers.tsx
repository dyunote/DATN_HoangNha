import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { VOUCHERS, formatVND } from '@/data'
import type { Voucher } from '@/types'
import { adminApi, type ApiVoucher } from '@/api/services'
import { PageHeader, Card, Table, Row, Cell } from './shared'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

const mapVoucher = (v: ApiVoucher): Voucher => ({
  id: v.id,
  code: v.code,
  type: v.type,
  discount: v.type === 'percent' ? `${v.value}%` : v.type === 'fixed' ? `${Math.round(v.value / 1000)}K` : 'Freeship',
  description: v.description,
  minOrder: v.minOrder,
  expiry: new Date(v.expiry).toLocaleDateString('vi-VN'),
  used: v.usedCount >= v.usageLimit,
})

const EMPTY_FORM = { code: '', type: 'percent', value: 10, description: '', minOrder: 0, expiry: '2026-12-31' }

export default function AdminVouchers() {
  // UC-29: voucher thật từ backend, fallback mock
  const [list, setList] = useState(VOUCHERS)
  const [editing, setEditing] = useState<Voucher | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const { toast } = useToast()

  const reload = () => adminApi.vouchers().then((data) => setList(data.map(mapVoucher))).catch(() => {})

  useEffect(() => {
    reload()
  }, [])

  const save = async () => {
    if (!form.code) {
      toast('Vui lòng nhập mã voucher', 'warning')
      return
    }
    try {
      await adminApi.createVoucher({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        description: form.description,
        minOrder: Number(form.minOrder),
        expiry: form.expiry,
      })
      await reload()
      toast('Đã tạo voucher trong database ✓')
    } catch {
      setList((l) => [
        ...l,
        {
          id: Date.now(),
          code: form.code.toUpperCase(),
          type: form.type as Voucher['type'],
          discount: form.type === 'percent' ? `${form.value}%` : form.type === 'fixed' ? `${Math.round(Number(form.value) / 1000)}K` : 'Freeship',
          description: form.description,
          minOrder: Number(form.minOrder),
          expiry: form.expiry,
        },
      ])
      toast('Đã tạo (demo — cần quyền admin để ghi DB)', 'info')
    }
    setOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Quản lý voucher"
        subtitle={`${list.filter((v) => !v.used).length} voucher đang hoạt động`}
        onAdd={() => { setEditing(null); setForm(EMPTY_FORM); setOpen(true) }}
        addLabel="Tạo voucher"
      />

      <Card>
        <Table head={['Mã', 'Giảm', 'Mô tả', 'Đơn tối thiểu', 'Hết hạn', 'Trạng thái', '']}>
          {list.map((v) => (
            <Row key={v.id}>
              <Cell>
                <code className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold tracking-widest dark:bg-white/10 dark:text-white">{v.code}</code>
              </Cell>
              <Cell className="font-semibold text-accent-dark">{v.discount}</Cell>
              <Cell className="max-w-56 text-slate-500 dark:text-slate-400">{v.description}</Cell>
              <Cell className="tabular-nums dark:text-white">{formatVND(v.minOrder)}</Cell>
              <Cell className="text-slate-500 dark:text-slate-400">{v.expiry}</Cell>
              <Cell>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${v.used ? 'bg-slate-100 text-slate-400 dark:bg-white/10' : 'bg-success/10 text-success'}`}>
                  {v.used ? 'Hết lượt' : 'Hoạt động'}
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
                        value: parseInt(v.discount) || 0,
                        description: v.description,
                        minOrder: v.minOrder,
                        expiry: '2026-12-31',
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
                      adminApi.deleteVoucher(v.id).catch(() => {})
                      toast('Đã xóa voucher', 'info')
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
          <h3 className="font-display mb-6 text-xl font-medium dark:text-white">{editing ? 'Sửa voucher' : 'Tạo voucher mới'}</h3>
          <div className="space-y-4">
            <FormField label="Mã voucher" placeholder="SUMMER20" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">Loại giảm</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full cursor-pointer rounded-input border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền (đ)</option>
                  <option value="freeship">Miễn phí ship</option>
                </select>
              </div>
              <FormField label={form.type === 'percent' ? 'Giá trị (%)' : 'Giá trị (đ)'} type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Đơn tối thiểu (đ)" type="number" value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))} />
              <FormField label="Ngày hết hạn" type="date" value={form.expiry} onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))} />
            </div>
            <FormField label="Mô tả" placeholder="VD: Giảm 20% toàn bộ đơn hàng" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save}>{editing ? 'Cập nhật' : 'Tạo voucher'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
