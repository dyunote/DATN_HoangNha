import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Pencil, GripVertical } from 'lucide-react'
import { HERO_SLIDES } from '@/data'
import { adminApi } from '@/api/services'
import { PageHeader } from './shared'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

export default function AdminBanners() {
  // UC-30: banner thật từ backend, fallback mock
  const [list, setList] = useState(HERO_SLIDES.map((s, i) => ({ ...s, active: i < 2 })))
  const [editing, setEditing] = useState<(typeof list)[number] | null>(null)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
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
      .catch(() => {})
  }, [])

  return (
    <div>
      <PageHeader
        title="Quản lý banner"
        subtitle="Banner hero trang chủ"
        onAdd={() => { setEditing(null); setOpen(true) }}
        addLabel="Thêm banner"
      />

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
                adminApi.updateBanner(b.id, { active: !b.active }).catch(() => {})
              }}
              className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ${b.active ? 'bg-success' : 'bg-slate-200 dark:bg-white/15'}`}
              aria-label="Bật/tắt"
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${b.active ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <button
              onClick={() => { setEditing(b); setOpen(true) }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Sửa"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => { setList((l) => l.filter((x) => x.id !== b.id)); toast('Đã xóa banner', 'info') }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-danger/10 hover:text-danger"
              aria-label="Xóa"
            >
              <Trash2 size={15} />
            </button>
          </motion.div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} maxWidth="max-w-md">
        <div className="p-8">
          <h3 className="font-display mb-6 text-xl font-medium dark:text-white">{editing ? 'Sửa banner' : 'Thêm banner'}</h3>
          <div className="space-y-4">
            <FormField label="Tiêu đề" defaultValue={editing?.title} />
            <FormField label="Phụ đề" defaultValue={editing?.subtitle} />
            <FormField label="Eyebrow" defaultValue={editing?.eyebrow} />
            <FormField label="Ảnh (URL)" defaultValue={editing?.image} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={() => { setOpen(false); toast('Đã lưu banner ✓') }}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
