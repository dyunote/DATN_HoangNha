import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from './shared'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import type { Category } from '@/types'
import { adminApi, catalogApi } from '@/api/services'
import { apiMessage } from '@/api/error'
import { refreshCategories } from '@/hooks/useCategories'

const EMPTY_FORM = { name: '', slug: '', image: '' }

export default function AdminCategories() {
  // UC-26: danh mục lấy từ database
  const [list, setList] = useState<Category[]>([])
  const [editing, setEditing] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const { toast } = useToast()

  const reload = () =>
    catalogApi
      .categories()
      .then(setList)
      .catch((err) => toast(apiMessage(err, 'Không tải được danh mục'), 'error'))

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
      await refreshCategories() // đồng bộ menu, trang chủ, form sản phẩm
      toast(editing ? 'Đã cập nhật danh mục ✓' : 'Đã thêm danh mục ✓')
      setOpen(false)
    } catch (err) {
      toast(apiMessage(err, 'Lưu danh mục thất bại'), 'error')
    }
  }

  const remove = async (id: number) => {
    try {
      await adminApi.deleteCategory(id)
      setList((l) => l.filter((x) => x.id !== id))
      await refreshCategories()
      toast('Đã xóa danh mục', 'info')
    } catch (err) {
      toast(apiMessage(err, 'Xóa danh mục thất bại'), 'error')
    }
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
          <h3 className="title-card mb-6 dark:text-white">
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
