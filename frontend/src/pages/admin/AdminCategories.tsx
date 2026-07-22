import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { CATEGORIES } from '@/data'
import { PageHeader } from './shared'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import type { Category } from '@/types'
import { adminApi, catalogApi } from '@/api/services'

const EMPTY_FORM = { name: '', slug: '', image: '' }

export default function AdminCategories() {
  // UC-26: danh mục từ backend, fallback mock
  const [list, setList] = useState(CATEGORIES)
  const [source, setSource] = useState<'api' | 'mock'>('mock')
  const [editing, setEditing] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const { toast } = useToast()

  const reload = () =>
    catalogApi
      .categories()
      .then((data) => {
        setList(data)
        setSource('api')
      })
      .catch(() => {})

  useEffect(() => {
    reload()
  }, [])

  const openForm = (c: Category | null) => {
    setEditing(c)
    setForm(c ? { name: c.name, slug: c.slug, image: c.image } : EMPTY_FORM)
    setOpen(true)
  }

  const save = async () => {
    if (!form.name || !form.slug) {
      toast('Vui lòng nhập tên và slug', 'warning')
      return
    }
    try {
      if (editing) await adminApi.updateCategory(editing.id, form)
      else await adminApi.createCategory(form)
      await reload()
      toast(editing ? 'Đã cập nhật danh mục trong database ✓' : 'Đã thêm danh mục vào database ✓')
    } catch {
      // Chế độ demo cục bộ
      if (editing) setList((l) => l.map((c) => (c.id === editing.id ? { ...c, ...form } : c)))
      else setList((l) => [...l, { ...form, id: Date.now(), count: 0 }])
      toast('Đã lưu (demo — cần quyền admin để ghi DB)', 'info')
    }
    setOpen(false)
  }

  const remove = (id: number) => {
    setList((l) => l.filter((x) => x.id !== id))
    if (source === 'api') adminApi.deleteCategory(id).catch(() => {})
    toast('Đã xóa danh mục', 'info')
  }

  return (
    <div>
      <PageHeader
        title="Quản lý danh mục"
        subtitle={`${list.length} danh mục`}
        onAdd={() => openForm(null)}
        addLabel="Thêm danh mục"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {list.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.45 }}
            className="group relative overflow-hidden rounded-card border border-slate-200/60 bg-white dark:border-white/5 dark:bg-zinc-900"
          >
            <div className="img-zoom h-36 overflow-hidden">
              <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold dark:text-white">{c.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">{c.count} sản phẩm · /{c.slug}</p>
            </div>
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <button
                onClick={() => openForm(c)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink shadow backdrop-blur transition-colors hover:bg-ink hover:text-white"
                aria-label="Sửa"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => remove(c.id)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-danger shadow backdrop-blur transition-colors hover:bg-danger hover:text-white"
                aria-label="Xóa"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} maxWidth="max-w-md">
        <div className="p-8">
          <h3 className="font-display mb-6 text-xl font-medium dark:text-white">
            {editing ? 'Sửa danh mục' : 'Thêm danh mục'}
          </h3>
          <div className="space-y-4">
            <FormField label="Tên danh mục" placeholder="VD: Áo khoác" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <FormField label="Slug" placeholder="ao-khoac" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            <FormField label="Ảnh (URL)" placeholder="https://..." value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save}>{editing ? 'Cập nhật' : 'Thêm'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
