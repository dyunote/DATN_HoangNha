import { useEffect, useRef, useState } from 'react'
import { Link2, Loader2, Pencil, Plus, Trash2, UploadCloud, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatVND } from '@/data'
import type { Product } from '@/types'
import { refreshProducts, useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { adminApi } from '@/api/services'
import { apiMessage } from '@/api/error'
import { PageHeader, SearchBox, Card, Table, Row, Cell } from './shared'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

/**
 * Các ô số dùng kiểu `number | ''` thay vì `number`.
 * Lý do: nếu để mặc định 0, ô input hiện sẵn "0" và khi gõ tiếp sẽ thành
 * "0100" — người dùng phải tự xóa số 0. Chuỗi rỗng cho phép ô trống thật sự.
 */
interface ProductForm {
  name: string
  category: string
  brand: string
  price: number | ''
  oldPrice: number | ''
  material: string
  description: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  category: '',
  brand: 'Hoàng Nha',
  price: '',
  oldPrice: '',
  material: 'Cotton hữu cơ',
  description: '',
}

/**
 * Một dòng biến thể trong form. `id` chỉ có ở biến thể đã nằm trong DB —
 * dòng mới thêm chưa có id, dùng `key` tạm để React phân biệt.
 */
interface VariantDraft {
  id?: number
  key: string
  color: string
  colorHex: string
  size: string
  stock: number | ''
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL']

const newVariantRow = (size = 'M'): VariantDraft => ({
  key: `tmp-${Math.random().toString(36).slice(2)}`,
  color: 'Mặc định',
  colorHex: '#111111',
  size,
  stock: 10,
})

/** Ô trống → '' (giữ ô rỗng), ngược lại ép về số */
const toNum = (v: string): number | '' => (v === '' ? '' : Number(v))

export default function AdminProducts() {
  // UC-25: sản phẩm lấy thẳng từ database
  const { products, loading, error } = useProducts()
  const { categories } = useCategories()
  const [list, setList] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  // Ảnh của sản phẩm đang soạn: mảng URL (/uploads/... hoặc link ngoài)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  // Biến thể thật của sản phẩm — tồn kho lưu ở đây, không ở bảng Product
  const [variants, setVariants] = useState<VariantDraft[]>([])
  /** id các biến thể đã xóa trong form, chờ gọi API xóa khi bấm Lưu */
  const [removedVariantIds, setRemovedVariantIds] = useState<number[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setList(products)
  }, [products])

  const openForm = (p: Product | null) => {
    setEditing(p)
    setForm(
      p
        ? { name: p.name, category: p.category, brand: p.brand, price: p.price, oldPrice: p.oldPrice ?? '', material: p.material, description: p.description }
        // Danh mục mặc định lấy từ DB thay vì hardcode 'Áo khoác'
        : { ...EMPTY_FORM, category: categories[0]?.name ?? '' },
    )
    setImages(p?.images ?? [])
    setUrlInput('')
    setRemovedVariantIds([])
    setFormOpen(true)

    if (!p) {
      // Sản phẩm mới: gợi ý sẵn 3 size phổ biến, admin sửa lại tùy ý
      setVariants(['S', 'M', 'L'].map(newVariantRow))
      return
    }
    // Sửa sản phẩm: lấy biến thể THẬT từ DB thay vì suy ra từ p.sizes
    setLoadingVariants(true)
    adminApi
      .variants(p.id)
      .then((list) =>
        setVariants(
          list.map((v) => ({ id: v.id, key: `db-${v.id}`, color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock })),
        ),
      )
      .catch(() => {
        toast('Không tải được biến thể từ server', 'warning')
        setVariants([])
      })
      .finally(() => setLoadingVariants(false))
  }

  const setVariant = (key: string, patch: Partial<VariantDraft>) =>
    setVariants((list) => list.map((v) => (v.key === key ? { ...v, ...patch } : v)))

  const removeVariant = (v: VariantDraft) => {
    if (v.id) setRemovedVariantIds((ids) => [...ids, v.id!])
    setVariants((list) => list.filter((x) => x.key !== v.key))
  }

  /** Đọc File thành data URL base64 để gửi lên API upload */
  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Không đọc được file'))
      reader.readAsDataURL(file)
    })

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast(`"${file.name}" không phải file ảnh`, 'warning')
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          toast(`"${file.name}" vượt quá 5MB`, 'warning')
          continue
        }
        const url = await adminApi.uploadImage(await toDataUrl(file))
        setImages((imgs) => [...imgs, url])
      }
    } catch {
      toast('Upload thất bại — cần đăng nhập admin và backend đang chạy', 'error')
    } finally {
      setUploading(false)
      // Reset input để chọn lại đúng file vừa xóa vẫn kích hoạt onChange
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const addUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      toast('URL phải bắt đầu bằng http:// hoặc https://', 'warning')
      return
    }
    setImages((imgs) => [...imgs, url])
    setUrlInput('')
  }

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // Lưu sản phẩm: ghi vào database qua admin API, fallback cập nhật cục bộ
  const save = async () => {
    if (!form.name || !form.price) {
      toast('Vui lòng nhập tên và giá sản phẩm', 'warning')
      return
    }
    if (!variants.length) {
      toast('Thêm ít nhất một biến thể — tồn kho lưu theo từng biến thể', 'warning')
      return
    }
    // Trùng (màu, size) sẽ vi phạm @@unique ở DB → chặn sớm cho dễ hiểu
    const keys = variants.map((v) => `${v.color.trim().toLowerCase()}|${v.size}`)
    if (new Set(keys).size !== keys.length) {
      toast('Có hai biến thể trùng màu và size', 'warning')
      return
    }
    const categoryId = categories.find((c) => c.name === form.category)?.id
    if (!categoryId) {
      toast('Danh mục không hợp lệ', 'warning')
      return
    }
    const payload = {
      name: form.name,
      categoryId,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice) || null,
      brand: form.brand,
      material: form.material,
      description: form.description,
      images,
    }
    setSaving(true)
    try {
      if (editing) {
        await adminApi.updateProduct(editing.id, payload)
        // Đồng bộ biến thể: xóa dòng bị bỏ, tạo dòng mới, cập nhật dòng đã có
        await Promise.all([
          ...removedVariantIds.map((id) => adminApi.deleteVariant(id)),
          ...variants.map((v) =>
            v.id
              ? adminApi.updateVariant(v.id, { color: v.color, colorHex: v.colorHex, size: v.size, stock: Number(v.stock) || 0 })
              : adminApi.createVariant(editing.id, { color: v.color, colorHex: v.colorHex, size: v.size, stock: Number(v.stock) || 0 }),
          ),
        ])
        toast('Đã cập nhật sản phẩm ✓')
      } else {
        await adminApi.createProduct({
          ...payload,
          variants: variants.map((v) => ({ color: v.color, colorHex: v.colorHex, size: v.size, stock: Number(v.stock) || 0 })),
        })
        toast('Đã thêm sản phẩm ✓')
      }
      // Đọc lại từ DB thay vì đoán state cục bộ — số liệu hiển thị luôn là số thật
      await refreshProducts()
      setFormOpen(false)
    } catch (err) {
      toast(apiMessage(err, 'Lưu thất bại'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const filtered = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))

  const removeProduct = async (id: number) => {
    try {
      await adminApi.deleteProduct(id)
      toast('Đã xóa sản phẩm khỏi database', 'info')
      await refreshProducts()
    } catch (err) {
      toast(apiMessage(err, 'Xóa thất bại'), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Quản lý sản phẩm"
        subtitle={`${list.length} sản phẩm · ${list.filter((p) => p.stock < 10).length} sắp hết hàng`}
        onAdd={() => openForm(null)}
        addLabel="Thêm sản phẩm"
      >
        <SearchBox value={q} onChange={setQ} placeholder="Tìm sản phẩm..." />
      </PageHeader>

      {/* Nói thật trạng thái dữ liệu thay vì lặng lẽ hiện hàng giả */}
      {error && (
        <p className="mb-4 rounded-card bg-danger/10 px-5 py-4 text-sm text-danger">
          Không tải được sản phẩm từ máy chủ. Kiểm tra backend và MySQL đang chạy.
        </p>
      )}
      {loading && <p className="mb-4 text-sm text-slate-400">Đang tải sản phẩm…</p>}
      {!loading && !error && list.length === 0 && (
        <p className="mb-4 rounded-card bg-white px-5 py-10 text-center text-sm text-slate-400 ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10">
          Chưa có sản phẩm nào trong database.
        </p>
      )}

      <Card>
        <Table head={['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Đã bán', 'Trạng thái', '']}>
          {filtered.slice(0, 12).map((p) => (
            <Row key={p.id}>
              <Cell>
                <div className="flex items-center gap-3">
                  <img src={p.images[0]} alt="" className="h-12 w-9 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium dark:text-white">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.brand}</p>
                  </div>
                </div>
              </Cell>
              <Cell className="text-slate-500 dark:text-slate-400">{p.category}</Cell>
              <Cell>
                <p className="font-medium tabular-nums dark:text-white">{formatVND(p.price)}</p>
                {p.oldPrice && <p className="text-[11px] text-slate-400 line-through">{formatVND(p.oldPrice)}</p>}
              </Cell>
              <Cell className="tabular-nums dark:text-white">{p.stock}</Cell>
              <Cell className="tabular-nums dark:text-white">{p.sold}</Cell>
              <Cell>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
                  p.stock === 0 ? 'bg-danger/10 text-danger' : p.stock < 10 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                }`}>
                  {p.stock === 0 ? 'Hết hàng' : p.stock < 10 ? 'Sắp hết' : 'Còn hàng'}
                </span>
              </Cell>
              <Cell>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => openForm(p)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Sửa"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => removeProduct(p.id)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger"
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

      {/* Product form drawer */}
      <AnimatePresence>
        {formOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm"
              onClick={() => setFormOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-[85] flex w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5 dark:border-white/5">
                <h3 className="title-card dark:text-white">
                  {editing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h3>
                <button onClick={() => setFormOpen(false)} className="cursor-pointer text-slate-400 hover:text-ink dark:hover:text-white" aria-label="Đóng">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto px-7 py-6">
                {/* Image upload */}
                <div>
                  <p className="label-field mb-2 text-slate-500 dark:text-slate-400">Hình ảnh</p>
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((im, i) => (
                      <div key={`${im}-${i}`} className="group relative aspect-[3/4] overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-white/10">
                        <img src={im} alt="" className="h-full w-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 rounded bg-ink/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            ẢNH BÌA
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Xóa ảnh"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-accent hover:text-accent-dark disabled:cursor-wait dark:border-white/15"
                    >
                      {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                      <span className="text-[10px] font-semibold uppercase">{uploading ? 'Đang tải' : 'Tải lên'}</span>
                    </button>
                    {/* input file ẩn — nút phía trên chỉ là lớp giao diện gọi click() */}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>

                  {/* Cách 2: dán link ảnh có sẵn */}
                  <div className="mt-3 flex gap-2">
                    <div className="relative flex-1">
                      <Link2 size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                      <input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                        placeholder="Hoặc dán URL ảnh: https://..."
                        className="w-full rounded-input border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addUrl}
                      className="cursor-pointer rounded-input border border-slate-200 px-4 text-xs font-semibold tracking-wider uppercase transition-colors hover:border-accent hover:text-accent-dark dark:border-white/10 dark:text-white"
                    >
                      Thêm
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">Ảnh đầu tiên là ảnh bìa. Tối đa 5MB mỗi ảnh.</p>
                </div>
                <FormField label="Tên sản phẩm" placeholder="VD: Áo khoác dạ Oversized" value={form.name} onChange={(e) => set('name', e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">Danh mục</label>
                    <select
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      className="w-full cursor-pointer rounded-input border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                    >
                      {categories.map((c) => <option key={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <FormField label="Thương hiệu" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Giá bán (đ)" type="number" min={0} placeholder="VD: 890000" value={form.price} onChange={(e) => set('price', toNum(e.target.value))} />
                  <FormField label="Giá gốc (đ)" type="number" min={0} placeholder="Bỏ trống nếu không sale" value={form.oldPrice} onChange={(e) => set('oldPrice', toNum(e.target.value))} />
                </div>
                {/* Tồn kho không nằm ở đây — xem bảng biến thể phía dưới */}
                <FormField label="Chất liệu" value={form.material} onChange={(e) => set('material', e.target.value)} />
                <div>
                  <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">Mô tả</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Mô tả sản phẩm..."
                    className="w-full rounded-input border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                {/* Biến thể: màu × size × tồn kho — đây mới là nơi lưu số tồn kho thật */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="label-field text-slate-500 dark:text-slate-400">
                      Biến thể &amp; tồn kho
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Tổng: {variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} sản phẩm
                    </span>
                  </div>

                  {loadingVariants ? (
                    <p className="py-4 text-center text-xs text-slate-400">Đang tải biến thể…</p>
                  ) : (
                    <div className="space-y-2">
                      {variants.map((v) => (
                        <div key={v.key} className="flex items-center gap-2">
                          {/* Màu: ô chọn màu + tên màu */}
                          <input
                            type="color"
                            value={v.colorHex}
                            onChange={(e) => setVariant(v.key, { colorHex: e.target.value })}
                            className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-900"
                            aria-label="Mã màu"
                          />
                          <input
                            value={v.color}
                            onChange={(e) => setVariant(v.key, { color: e.target.value })}
                            placeholder="Tên màu"
                            className="min-w-0 flex-1 rounded-input border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                          />
                          <select
                            value={v.size}
                            onChange={(e) => setVariant(v.key, { size: e.target.value })}
                            className="w-20 shrink-0 cursor-pointer rounded-input border border-slate-200 bg-white px-2 py-2.5 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                          >
                            {SIZES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                          <input
                            type="number"
                            min={0}
                            value={v.stock}
                            onChange={(e) => setVariant(v.key, { stock: e.target.value === '' ? '' : Number(e.target.value) })}
                            placeholder="Kho"
                            className="w-20 shrink-0 rounded-input border border-slate-200 bg-white px-3 py-2.5 text-sm tabular-nums outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariant(v)}
                            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger"
                            aria-label="Xóa biến thể"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setVariants((l) => [...l, newVariantRow()])}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-input border border-dashed border-slate-300 py-2.5 text-xs font-semibold tracking-wider uppercase text-slate-500 transition-colors hover:border-accent hover:text-accent-dark dark:border-white/15 dark:text-slate-400"
                      >
                        <Plus size={14} /> Thêm biến thể
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 px-7 py-5 dark:border-white/5">
                <Button variant="ghost" onClick={() => setFormOpen(false)}>Hủy</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
