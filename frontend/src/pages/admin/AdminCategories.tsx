import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, UploadCloud, Loader2, Link2, RefreshCw, X } from 'lucide-react'
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
import { apiMessage, apiStatus } from '@/api/error'
import { refreshCategories } from '@/hooks/useCategories'
import { usePageTitle } from '@/hooks/usePageTitle'
import { slugify } from '@/lib/slugify'

const EMPTY_FORM = { name: '', slug: '', image: '' }
/** Slug hợp lệ — PHẢI khớp SLUG_RE ở backend/src/routes/admin.ts */
const SLUG_RE = /^[a-z0-9-]+$/

type FormErrors = { name?: string; slug?: string; image?: string }

export default function AdminCategories() {
  usePageTitle('Quản lý danh mục · Quản trị')
  // UC-26: danh mục lấy từ database
  const [list, setList] = useState<Category[]>([])
  const [editing, setEditing] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  /** Lỗi hiện DƯỚI TỪNG Ô — toast bay lên góc phải không chỉ được ô nào sai */
  const [errors, setErrors] = useState<FormErrors>({})
  /**
   * Admin đã tự gõ vào ô slug chưa. Chưa gõ → slug tự chạy theo tên
   * ("Áo khoác" → "ao-khoac"). Gõ rồi → thôi không ghi đè công của họ.
   * Khi SỬA danh mục cũ thì mặc định coi như đã gõ: đổi slug là đổi URL
   * /danh-muc?loai=... nên mọi link cũ khách đã lưu sẽ hỏng.
   */
  const [slugTouched, setSlugTouched] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
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
    setErrors({})
    setSlugTouched(!!c) // sửa danh mục cũ → không tự đổi slug
    setUrlInput('')
    setOpen(true)
  }

  /**
   * Dọn sạch form. Gắn vào `onClose` của Modal nên cả nút X, bấm ra nền và
   * phím Esc đều đi qua đây — trước đây chỉ `openForm` reset, nên vừa bấm
   * Sửa rồi đóng bằng dấu X thì lần bấm "Thêm mới" kế tiếp vẫn còn dữ liệu cũ.
   */
  const closeForm = () => {
    setOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setSlugTouched(false)
    setUrlInput('')
  }

  const onNameChange = (value: string) => {
    setForm((f) => ({ ...f, name: value, slug: slugTouched ? f.slug : slugify(value) }))
    setErrors((e) => ({ ...e, name: undefined, slug: undefined }))
  }

  const onSlugChange = (value: string) => {
    setSlugTouched(true)
    setForm((f) => ({ ...f, slug: value }))
    setErrors((e) => ({ ...e, slug: undefined }))
  }

  /** Nút "Tạo lại từ tên" — cho ai CỐ Ý muốn đổi slug theo tên mới */
  const regenerateSlug = () => {
    setForm((f) => ({ ...f, slug: slugify(f.name) }))
    setSlugTouched(false)
    setErrors((e) => ({ ...e, slug: undefined }))
  }

  /** Đọc File thành data URL base64 để gửi lên API upload */
  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Không đọc được file'))
      reader.readAsDataURL(file)
    })

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast(`"${file.name}" không phải file ảnh`, 'warning')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast(`"${file.name}" vượt quá 5MB`, 'warning')
      return
    }
    setUploading(true)
    try {
      const url = await adminApi.uploadImage(await toDataUrl(file))
      setForm((f) => ({ ...f, image: url }))
      setErrors((e) => ({ ...e, image: undefined }))
    } catch (err) {
      toast(apiMessage(err, 'Upload thất bại — cần đăng nhập admin và backend đang chạy'), 'error')
    } finally {
      setUploading(false)
      // Reset input để chọn lại đúng file vừa xóa vẫn kích hoạt onChange
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  /** Cách phụ: dùng link ảnh có sẵn thay vì tải file lên */
  const applyUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      setErrors((e) => ({ ...e, image: 'Link phải bắt đầu bằng http:// hoặc https://' }))
      return
    }
    setForm((f) => ({ ...f, image: url }))
    setErrors((e) => ({ ...e, image: undefined }))
    setUrlInput('')
  }

  /** Kiểm tra tại chỗ, KHÔNG gọi API nếu còn ô sai. Server vẫn kiểm lại lần nữa. */
  const validate = () => {
    const next: FormErrors = {}
    const name = form.name.trim()
    if (!name) next.name = 'Vui lòng nhập tên danh mục'
    else if (name.length < 2) next.name = 'Tên danh mục phải có ít nhất 2 ký tự'
    else if (name.length > 50) next.name = 'Tên danh mục không được dài quá 50 ký tự'

    const slug = form.slug.trim()
    if (!slug) next.slug = 'Vui lòng nhập slug, hoặc bấm "Tạo lại từ tên"'
    else if (!SLUG_RE.test(slug)) {
      next.slug = 'Slug chỉ dùng chữ thường không dấu, số và dấu gạch ngang (vd: ao-khoac)'
    }

    const image = form.image.trim()
    if (image && !/^(\/uploads\/|https?:\/\/)/.test(image)) {
      next.image = 'Ảnh phải là file đã tải lên hoặc link http(s)://'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      image: form.image.trim(),
    }
    try {
      if (editing) await adminApi.updateCategory(editing.id, payload)
      else await adminApi.createCategory(payload)
      await reload()
      await refreshCategories() // đồng bộ menu, trang chủ, form sản phẩm
      toast(editing ? 'Đã cập nhật danh mục ✓' : 'Đã thêm danh mục ✓')
      closeForm()
    } catch (err) {
      // 409 = slug đã có người dùng → gắn thẳng vào ô slug, đó là ô phải sửa.
      // Toast chung chung bắt admin tự đoán mình sai chỗ nào.
      if (apiStatus(err) === 409) {
        setErrors((e) => ({ ...e, slug: apiMessage(err, 'Slug này đã tồn tại') }))
      } else {
        toast(apiMessage(err, 'Lưu danh mục thất bại'), 'error')
      }
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
              {/* Ảnh được phép rỗng → render khối chữ cái đầu, chứ không để
                  thẻ <img src=""> hiện icon ảnh vỡ trên mọi card */}
              {c.image ? (
                <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-white/5">
                  <span className="font-display text-4xl font-semibold text-slate-400 dark:text-slate-500">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
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
              {/* Còn sản phẩm là chắc chắn xóa không được (khóa ngoại) → khóa
                  nút luôn, khỏi để admin bấm rồi ăn lỗi. Tooltip đặt ở <span>
                  bọc ngoài vì nút disabled không hiện title trên Chrome.
                  Danh mục rỗng thì mất luôn → vẫn hỏi lại trước khi xóa. */}
              <span
                title={
                  c.count > 0
                    ? `Danh mục đang có ${c.count} sản phẩm — chuyển sản phẩm sang danh mục khác trước khi xóa`
                    : `Xóa danh mục ${c.name}`
                }
              >
                <button
                  onClick={() => setDeleteTarget(c)}
                  disabled={c.count > 0}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-danger shadow backdrop-blur transition-colors hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-slate-400 disabled:hover:bg-white/60 disabled:hover:text-slate-400"
                  aria-label={`Xóa danh mục ${c.name}`}
                  aria-disabled={c.count > 0}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal open={open} onClose={closeForm} maxWidth="max-w-md" label={editing ? 'Sửa danh mục' : 'Thêm danh mục'}>
        <div className="p-8">
          <h3 className="title-card mb-6 dark:text-white">
            {editing ? 'Sửa danh mục' : 'Thêm danh mục'}
          </h3>
          <div className="space-y-4">
            <FormField
              label="Tên danh mục"
              placeholder="VD: Áo khoác"
              value={form.name}
              error={errors.name}
              onChange={(e) => onNameChange(e.target.value)}
            />

            <div>
              <FormField
                label="Slug (đường dẫn)"
                placeholder="ao-khoac"
                value={form.slug}
                error={errors.slug}
                onChange={(e) => onSlugChange(e.target.value)}
              />
              <div className="mt-1.5 flex items-start justify-between gap-3">
                <p className="min-w-0 text-xs text-muted">
                  <span className="font-mono break-all">/danh-muc?loai={form.slug || 'ao-khoac'}</span>
                  {editing && ' — đổi slug sẽ làm hỏng các link cũ.'}
                </p>
                <button
                  type="button"
                  onClick={regenerateSlug}
                  disabled={!form.name.trim()}
                  className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-semibold text-accent-dark uppercase transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw size={11} /> Tạo lại từ tên
                </button>
              </div>
            </div>

            {/* Ảnh: ưu tiên tải file lên, dán link chỉ là lựa chọn phụ */}
            <div>
              <p className="label-field mb-2 text-slate-500 dark:text-slate-400">Ảnh danh mục (tùy chọn)</p>
              <div className="flex items-start gap-4">
                {form.image ? (
                  <div className="group/img relative h-24 w-24 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-white/10">
                    <img src={form.image} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image: '' }))}
                      className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink/50 text-white opacity-0 transition-opacity group-hover/img:opacity-100"
                      aria-label="Xóa ảnh"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-muted transition-colors hover:border-accent hover:text-accent-dark disabled:cursor-wait dark:border-white/15"
                  >
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                    <span className="text-[10px] font-semibold uppercase">{uploading ? 'Đang tải' : 'Tải lên'}</span>
                  </button>
                )}
                {/* input file ẩn — nút phía trên chỉ là lớp giao diện gọi click() */}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files)} />

                <div className="min-w-0 flex-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                      <input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyUrl())}
                        placeholder="hoặc dán link ảnh https://..."
                        aria-label="Link ảnh"
                        className="w-full rounded-input border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-xs outline-none placeholder:text-slate-400 focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={applyUrl} disabled={!urlInput.trim()}>
                      Dùng
                    </Button>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">JPG, PNG, WEBP — tối đa 5MB.</p>
                  {errors.image && <p className="mt-1.5 text-xs font-medium text-danger">{errors.image}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeForm} disabled={saving}>Hủy</Button>
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
            Danh mục <b className="text-ink dark:text-white">{deleteTarget?.name}</b> hiện không có sản phẩm nào
            và sẽ bị xóa khỏi database. Thao tác này không hoàn tác được.
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
