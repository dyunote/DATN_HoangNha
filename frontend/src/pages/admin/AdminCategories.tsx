import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from './shared'
import { CardListSkeleton } from '@/components/ui/Skeleton'
import ErrorState from '@/components/ui/ErrorState'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
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
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [saving, setSaving] = useState(false)
  /** Danh mục vừa bấm thùng rác — chờ xác nhận, CHƯA gọi API xóa */
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  /** Lỗi tải được GIỮ trên màn hình kèm nút thử lại, không chỉ toast rồi mất */
  const reload = async () => {
    setLoadError('')
    try {
      setList(await catalogApi.categories())
    } catch (err) {
      setLoadError(apiMessage(err, 'Không tải được danh mục'))
    }
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retry = async () => {
    setRetrying(true)
    await reload()
    setRetrying(false)
  }

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
    setSaving(true)
    try {
      if (editing) await adminApi.updateCategory(editing.id, form)
      else await adminApi.createCategory(form)
      await reload()
      await refreshCategories() // đồng bộ menu, trang chủ, form sản phẩm
      toast(editing ? 'Đã cập nhật danh mục ✓' : 'Đã thêm danh mục ✓')
      setOpen(false)
    } catch (err) {
      toast(apiMessage(err, 'Lưu danh mục thất bại'), 'error')
    } finally {
      setSaving(false)
    }
  }

  /** Xóa thật — chỉ chạy sau khi admin đã xác nhận trong hộp thoại */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.deleteCategory(deleteTarget.id)
      setList((l) => l.filter((x) => x.id !== deleteTarget.id))
      await refreshCategories()
      setDeleteTarget(null)
      toast('Đã xóa danh mục', 'info')
    } catch (err) {
      toast(apiMessage(err, 'Xóa danh mục thất bại'), 'error')
    } finally {
      setDeleting(false)
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

      {loadError && <ErrorState message={loadError} onRetry={retry} retrying={retrying} className="mb-4" />}

      {loading && <CardListSkeleton count={4} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" />}

      {!loading && !loadError && list.length === 0 && (
        <p className="rounded-card bg-white px-5 py-14 text-center text-sm text-slate-500 ring-1 ring-slate-100 dark:bg-zinc-900 dark:text-slate-400 dark:ring-white/10">
          Chưa có danh mục nào — bấm “Thêm danh mục” để tạo cái đầu tiên.
        </p>
      )}

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
              <p className="mt-0.5 text-xs text-muted">{c.count} sản phẩm · /{c.slug}</p>
            </div>
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <button
                onClick={() => openForm(c)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink shadow backdrop-blur transition-colors hover:bg-ink hover:text-white"
                aria-label="Sửa"
              >
                <Pencil size={13} />
              </button>
              {/* Hỏi lại trước khi xóa — danh mục rỗng thì mất luôn, không lấy lại được */}
              <button
                onClick={() => setDeleteTarget(c)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-danger shadow backdrop-blur transition-colors hover:bg-danger hover:text-white"
                aria-label={`Xóa danh mục ${c.name}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} maxWidth="max-w-md" label={editing ? 'Sửa danh mục' : 'Thêm danh mục'}>
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
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button onClick={save} loading={saving}>
              {saving ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Thêm'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa danh mục?"
        message={
          <>
            Danh mục <b className="text-ink dark:text-white">{deleteTarget?.name}</b> sẽ bị xóa khỏi database.
            Danh mục đang có sản phẩm thì server sẽ từ chối — hãy chuyển sản phẩm sang danh mục khác trước.
          </>
        }
        confirmLabel="Xóa danh mục"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
