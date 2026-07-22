import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Plus, Pencil, Trash2, X } from 'lucide-react'
import { ADDRESSES } from '@/data'
import type { Address } from '@/types'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { useToast } from '@/context/ToastContext'
import { meApi } from '@/api/services'

const EMPTY_FORM = { label: 'Nhà riêng', name: '', phone: '', street: '', ward: '', district: '', city: '' }

export default function Addresses() {
  // UC-19: sổ địa chỉ từ backend, fallback mock khi backend tắt / chưa đăng nhập JWT
  const [list, setList] = useState<Address[]>(ADDRESSES)
  const [source, setSource] = useState<'api' | 'mock'>('mock')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const { toast } = useToast()

  useEffect(() => {
    meApi
      .addresses()
      .then((data) => {
        setList(data)
        setSource('api')
      })
      .catch(() => {})
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
    if (source === 'api') {
      try {
        if (editing) {
          await meApi.updateAddress(editing.id, form)
        } else {
          await meApi.addAddress({ ...form, isDefault: list.length === 0 })
        }
        setList(await meApi.addresses())
        setFormOpen(false)
        toast(editing ? 'Đã cập nhật địa chỉ ✓' : 'Đã thêm địa chỉ mới ✓')
        return
      } catch {
        toast('Không lưu được lên server — lưu cục bộ', 'warning')
      }
    }
    // Chế độ demo cục bộ
    if (editing) {
      setList((l) => l.map((a) => (a.id === editing.id ? { ...a, ...form } : a)))
    } else {
      setList((l) => [...l, { ...form, id: Date.now(), isDefault: l.length === 0 }])
    }
    setFormOpen(false)
    toast(editing ? 'Đã cập nhật địa chỉ ✓' : 'Đã thêm địa chỉ mới ✓')
  }

  const setDefault = (id: number) => {
    setList((l) => l.map((a) => ({ ...a, isDefault: a.id === id })))
    if (source === 'api') meApi.updateAddress(id, { isDefault: true }).catch(() => {})
    toast('Đã đặt làm địa chỉ mặc định ✓')
  }

  const removeAddr = (id: number) => {
    setList((l) => l.filter((a) => a.id !== id))
    if (source === 'api') meApi.deleteAddress(id).catch(() => {})
    toast('Đã xóa địa chỉ', 'info')
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium dark:text-white">Sổ địa chỉ</h1>
          <p className="mt-2 text-sm text-slate-400">Quản lý địa chỉ giao hàng của bạn.</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus size={15} /> Thêm địa chỉ
        </Button>
      </div>

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
                  <button
                    onClick={() => removeAddr(a.id)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Xóa"
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
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-card bg-white p-8 shadow-2xl dark:bg-zinc-900"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-xl font-medium dark:text-white">
                  {editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                </h3>
                <button onClick={() => setFormOpen(false)} className="cursor-pointer text-slate-400 hover:text-ink dark:hover:text-white">
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
                <Button variant="ghost" onClick={() => setFormOpen(false)}>Hủy</Button>
                <Button onClick={save}>{editing ? 'Cập nhật' : 'Thêm địa chỉ'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
