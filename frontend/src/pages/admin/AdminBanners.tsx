import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Pencil, GripVertical } from 'lucide-react'
import { adminApi } from '@/api/services'
import { apiMessage } from '@/api/error'
import { PageHeader } from './shared'
import { CardListSkeleton } from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

interface BannerRow {
  id: number
  eyebrow: string
  title: string
  subtitle: string
  image: string
  cta: string
  active: boolean
}

const EMPTY_FORM = { title: '', subtitle: '', eyebrow: '', image: '' }

export default function AdminBanners() {
  // UC-30: banner thật từ database
  const [list, setList] = useState<BannerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BannerRow | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  /** Banner vừa bấm thùng rác — chờ xác nhận, CHƯA gọi API xóa */
  const [deleteTarget, setDeleteTarget] = useState<BannerRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const reload = () =>
    adminApi
      .banners()
      .then((data) =>
        setList(
          data.map((b) => ({
            id: b.id,
            eyebrow: b.eyebrow,
            title: b.title,
            subtitle: b.subtitle,
            image: b.image,
            cta: 'Khám phá ngay',
            active: b.active,
          })),
        ),
      )
      .catch((err) => toast(apiMessage(err, 'Không tải được banner'), 'error'))

  useEffect(() => {
    reload().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const openForm = (b: BannerRow | null) => {
    setEditing(b)
    setForm(b ? { title: b.title, subtitle: b.subtitle, eyebrow: b.eyebrow, image: b.image } : EMPTY_FORM)
    setOpen(true)
  }

  // Trước đây nút Lưu chỉ đóng modal và báo "Đã lưu ✓" — không hề gọi API,
  // nên banner sửa xong tải lại trang là về như cũ.
  const save = async () => {
    if (!form.title || !form.image) {
      toast('Vui lòng nhập tiêu đề và đường dẫn ảnh', 'warning')
      return
    }
    setSaving(true)
    try {
      if (editing) await adminApi.updateBanner(editing.id, form)
      else await adminApi.createBanner(form)
      await reload()
      toast(editing ? 'Đã cập nhật banner ✓' : 'Đã thêm banner ✓')
      setOpen(false)
      setEditing(null)
    } catch (err) {
      toast(apiMessage(err, 'Lưu banner thất bại'), 'error')
    } finally {
      setSaving(false)
    }
  }

  /** Xóa thật — chỉ chạy sau khi admin đã xác nhận trong hộp thoại */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.deleteBanner(deleteTarget.id)
      setList((l) => l.filter((x) => x.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast('Đã xóa banner', 'info')
    } catch (err) {
      await reload()
      toast(apiMessage(err, 'Xóa banner thất bại'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Quản lý banner"
        subtitle="Banner hero trang chủ"
        onAdd={() => openForm(null)}
        addLabel="Thêm banner"
      />

      {loading && <CardListSkeleton count={3} className="space-y-4" />}

      {!loading && list.length === 0 && (
        <p className="rounded-card bg-white px-5 py-14 text-center text-sm text-slate-500 ring-1 ring-slate-100 dark:bg-zinc-900 dark:text-slate-400 dark:ring-white/10">
          Chưa có banner nào — bấm “Thêm banner” để tạo cái đầu tiên.
        </p>
      )}

      <div className="space-y-4">
        {list.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center gap-4 rounded-card border border-slate-200/60 bg-white p-4 transition-all hover:shadow-lg dark:border-white/5 dark:bg-zinc-900"
          >
            <GripVertical size={17} className="cursor-grab text-slate-300" />
            <img src={b.image} alt="" className="h-16 w-28 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold dark:text-white">{b.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{b.eyebrow} · {b.subtitle}</p>
            </div>
            {/* Switch */}
            <button
              onClick={() => {
                setList((l) => l.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)))
                // Lỗi thì gạt công tắc về chỗ cũ — không để admin tưởng banner đã tắt
                adminApi.updateBanner(b.id, { active: !b.active }).catch((err) => {
                  setList((l) => l.map((x) => (x.id === b.id ? { ...x, active: b.active } : x)))
                  toast(apiMessage(err, 'Không đổi được trạng thái banner'), 'error')
                })
              }}
              className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ${b.active ? 'bg-success' : 'bg-slate-200 dark:bg-white/15'}`}
              aria-label="Bật/tắt"
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${b.active ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <button
              onClick={() => openForm(b)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Sửa"
            >
              <Pencil size={15} />
            </button>
            {/* Hỏi lại trước khi xóa — banner đang bật mà xóa nhầm là trang chủ đổi ngay */}
            <button
              onClick={() => setDeleteTarget(b)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-danger/10 hover:text-danger"
              aria-label={`Xóa banner ${b.title}`}
            >
              <Trash2 size={15} />
            </button>
          </motion.div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} maxWidth="max-w-md" label={editing ? 'Sửa banner' : 'Thêm banner'}>
        <div className="p-8">
          <h3 className="title-card mb-6 dark:text-white">{editing ? 'Sửa banner' : 'Thêm banner'}</h3>
          <div className="space-y-4">
            <FormField label="Tiêu đề" value={form.title} onChange={set('title')} />
            <FormField label="Phụ đề" value={form.subtitle} onChange={set('subtitle')} />
            <FormField label="Eyebrow" value={form.eyebrow} onChange={set('eyebrow')} />
            <FormField label="Ảnh (URL)" value={form.image} onChange={set('image')} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button onClick={save} loading={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa banner?"
        message={
          <>
            Banner <b className="text-ink dark:text-white">{deleteTarget?.title}</b> sẽ bị xóa khỏi database.
            Nếu chỉ muốn tạm ẩn, hãy dùng công tắc bật/tắt thay vì xóa.
          </>
        }
        confirmLabel="Xóa banner"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
