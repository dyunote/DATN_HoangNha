import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Plus, Pencil, Trash2, X } from 'lucide-react'
import type { Address } from '@/types'
import Button from '@/components/ui/Button'
import { CardListSkeleton } from '@/components/ui/Skeleton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import { useToast } from '@/context/ToastContext'
import { useDismissable } from '@/hooks/useDismissable'
import { meApi } from '@/api/services'
import { apiMessage } from '@/api/error'

const EMPTY_FORM = { label: 'Nhà riêng', name: '', phone: '', street: '', ward: '', district: '', city: '' }

export default function Addresses() {
  // UC-19: sổ địa chỉ lấy từ database của user đang đăng nhập
  const [list, setList] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  /** Địa chỉ vừa bấm thùng rác — chờ xác nhận, CHƯA gọi API xóa */
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Hộp thoại này tự dựng bằng framer-motion (không qua ui/Modal) nên phải
  // tự gắn hành vi bàn phím: Esc, bẫy focus, khóa cuộn nền.
  const boxRef = useDismissable<HTMLDivElement>(formOpen, () => setFormOpen(false))
  const { toast } = useToast()

  useEffect(() => {
    meApi
      .addresses()
      .then(setList)
      .catch((err) => toast(apiMessage(err, 'Không tải được sổ địa chỉ'), 'error'))
      .finally(() => setLoading(false))
    // toast từ context là hàm ổn định, chỉ chạy một lần khi mở trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openForm = (a: Address | null) => {
    setEditing(a)
    setForm(a ? { label: a.label, name: a.name, phone: a.phone, street: a.street, ward: a.ward, district: a.district, city: a.city } : EMPTY_FORM)
    setFormOpen(true)
  }

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = async () => {
    if (!form.name || !form.phone || !form.street || !form.city) {
      toast('Vui lòng điền đủ người nhận, SĐT, địa chỉ và thành phố', 'warning')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await meApi.updateAddress(editing.id, form)
      } else {
        await meApi.addAddress({ ...form, isDefault: list.length === 0 })
      }
      // Đọc lại từ server thay vì tự đoán — tránh state lệch với DB
      setList(await meApi.addresses())
      setFormOpen(false)
      toast(editing ? 'Đã cập nhật địa chỉ ✓' : 'Đã thêm địa chỉ mới ✓')
    } catch (err) {
      toast(apiMessage(err, 'Lưu địa chỉ thất bại'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const setDefault = async (id: number) => {
    try {
      await meApi.updateAddress(id, { isDefault: true })
      setList(await meApi.addresses())
      toast('Đã đặt làm địa chỉ mặc định ✓')
    } catch (err) {
      toast(apiMessage(err, 'Không đặt được địa chỉ mặc định'), 'error')
    }
  }

  /** Xóa thật — chỉ chạy sau khi khách đã xác nhận trong hộp thoại */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await meApi.deleteAddress(deleteTarget.id)
      setList((l) => l.filter((a) => a.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast('Đã xóa địa chỉ', 'info')
    } catch (err) {
      toast(apiMessage(err, 'Xóa địa chỉ thất bại'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="title-panel dark:text-white">Sổ địa chỉ</h1>
          <p className="mt-2 text-sm text-slate-400">Quản lý địa chỉ giao hàng của bạn.</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus size={15} /> Thêm địa chỉ
        </Button>
      </div>

      {loading && <CardListSkeleton count={2} className="mt-8 grid gap-5 md:grid-cols-2" />}
      {!loading && list.length === 0 && (
        <p className="mt-8 rounded-card bg-white py-12 text-center text-sm text-slate-500 ring-1 ring-slate-100 dark:bg-zinc-900 dark:text-slate-400 dark:ring-white/10">
          Chưa có địa chỉ nào. Thêm địa chỉ để đặt hàng nhanh hơn.
        </p>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <AnimatePresence>
          {list.map((a) => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`group relative rounded-card bg-white p-6 shadow-sm ring-1 transition-all duration-300 hover:shadow-xl dark:bg-zinc-900 ${
                a.isDefault ? 'ring-2 ring-accent' : 'ring-slate-100 dark:ring-white/10'
              }`}
            >
              {a.isDefault && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold tracking-wider text-ink uppercase">
                  Mặc định
                </span>
              )}
              <div className="flex items-start justify-between">
                <span className="flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase dark:bg-white dark:text-ink">
                  <MapPin size={11} /> {a.label}
                </span>
                <div className="flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <button
                    onClick={() => openForm(a)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Sửa"
                  >
                    <Pencil size={14} />
                  </button>
                  {/* Hỏi lại trước khi xóa — nút nằm sát nút Sửa, rất dễ bấm nhầm */}
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label={`Xóa địa chỉ ${a.label}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-4 font-semibold dark:text-white">{a.name}</p>
              <p className="mt-1 text-sm text-slate-400">{a.phone}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {a.street}, {a.ward}, {a.district}, {a.city}
              </p>
              {!a.isDefault && (
                <button
                  onClick={() => setDefault(a.id)}
                  className="link-underline mt-4 cursor-pointer text-xs font-semibold tracking-widest text-accent-dark uppercase"
                >
                  Đặt làm mặc định
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          >
            <motion.div
              ref={boxRef}
              role="dialog"
              aria-modal="true"
              aria-label={editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-card bg-white p-8 shadow-2xl outline-none dark:bg-zinc-900"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="title-card dark:text-white">
                  {editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                </h3>
                <button onClick={() => setFormOpen(false)} className="cursor-pointer text-slate-400 hover:text-ink dark:hover:text-white" aria-label="Đóng">
                  <X size={20} />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nhãn" placeholder="Nhà riêng" value={form.label} onChange={set('label')} />
                <FormField label="Người nhận" placeholder="Nguyễn Văn A" value={form.name} onChange={set('name')} />
                <FormField label="Số điện thoại" placeholder="0901 234 567" value={form.phone} onChange={set('phone')} />
                <FormField label="Tỉnh / Thành phố" placeholder="TP. Hồ Chí Minh" value={form.city} onChange={set('city')} />
                <FormField label="Địa chỉ (số nhà, đường)" placeholder="86 Nguyễn Huệ" value={form.street} onChange={set('street')} />
                <FormField label="Phường / Xã" placeholder="Phường Bến Nghé" value={form.ward} onChange={set('ward')} />
                <FormField label="Quận / Huyện" placeholder="Quận 1" className="sm:col-span-2" value={form.district} onChange={set('district')} />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>Hủy</Button>
                <Button onClick={save} loading={saving}>
                  {saving ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Thêm địa chỉ'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa địa chỉ này?"
        message={
          <>
            Địa chỉ <b className="text-ink dark:text-white">{deleteTarget?.label}</b> — {deleteTarget?.street}
            {deleteTarget?.city ? `, ${deleteTarget.city}` : ''} sẽ bị xóa khỏi sổ địa chỉ. Đơn hàng cũ
            không bị ảnh hưởng vì địa chỉ giao đã được lưu riêng trong từng đơn.
          </>
        }
        confirmLabel="Xóa địa chỉ"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
