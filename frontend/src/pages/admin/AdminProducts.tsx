import { useEffect, useState } from 'react'
import { Pencil, Trash2, UploadCloud, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { PRODUCTS, CATEGORIES, formatVND } from '@/data'
import type { Product } from '@/types'
import { useProducts } from '@/hooks/useProducts'
import { adminApi } from '@/api/services'
import { PageHeader, SearchBox, Card, Table, Row, Cell } from './shared'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

const EMPTY_FORM = {
  name: '',
  category: 'Áo khoác',
  brand: 'Hoàng Nha',
  price: 0,
  oldPrice: 0,
  stock: 20,
  material: 'Cotton hữu cơ',
  description: '',
}

export default function AdminProducts() {
  // UC-25: sản phẩm từ backend, fallback mock
  const { products, source } = useProducts()
  const [list, setList] = useState<Product[]>(PRODUCTS)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const { toast } = useToast()

  useEffect(() => {
    setList(products)
  }, [products])

  const openForm = (p: Product | null) => {
    setEditing(p)
    setForm(
      p
        ? { name: p.name, category: p.category, brand: p.brand, price: p.price, oldPrice: p.oldPrice ?? 0, stock: p.stock, material: p.material, description: p.description }
        : EMPTY_FORM,
    )
    setFormOpen(true)
  }

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // Lưu sản phẩm: ghi vào database qua admin API, fallback cập nhật cục bộ
  const save = async () => {
    if (!form.name || !form.price) {
      toast('Vui lòng nhập tên và giá sản phẩm', 'warning')
      return
    }
    const categoryId = CATEGORIES.find((c) => c.name === form.category)?.id ?? 1
    const payload = {
      name: form.name,
      categoryId,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice) || null,
      brand: form.brand,
      material: form.material,
      description: form.description,
    }
    try {
      if (editing) {
        await adminApi.updateProduct(editing.id, payload)
        setList((l) => l.map((p) => (p.id === editing.id ? { ...p, ...form, oldPrice: Number(form.oldPrice) || undefined } : p)))
        toast('Đã cập nhật sản phẩm trong database ✓')
      } else {
        const created = await adminApi.createProduct(payload)
        setList((l) => [
          { ...PRODUCTS[0], ...form, id: created.id, images: PRODUCTS[0].images, oldPrice: Number(form.oldPrice) || undefined, sold: 0, isNew: true },
          ...l,
        ])
        toast('Đã thêm sản phẩm vào database ✓')
      }
    } catch {
      // Chế độ demo cục bộ (backend tắt hoặc chưa đăng nhập admin)
      if (editing) {
        setList((l) => l.map((p) => (p.id === editing.id ? { ...p, ...form, oldPrice: Number(form.oldPrice) || undefined } : p)))
      } else {
        setList((l) => [{ ...PRODUCTS[0], ...form, id: Date.now(), oldPrice: Number(form.oldPrice) || undefined, sold: 0, isNew: true }, ...l])
      }
      toast(editing ? 'Đã cập nhật (demo — cần quyền admin để ghi DB)' : 'Đã thêm (demo — cần quyền admin để ghi DB)', 'info')
    }
    setFormOpen(false)
  }

  const filtered = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))

  const removeProduct = (id: number) => {
    setList((l) => l.filter((p) => p.id !== id))
    if (source === 'api') {
      adminApi
        .deleteProduct(id)
        .then(() => toast('Đã xóa sản phẩm khỏi database', 'info'))
        .catch(() => toast('Xóa cục bộ (cần quyền admin để xóa trong DB)', 'warning'))
    } else {
      toast('Đã xóa sản phẩm', 'info')
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
                <h3 className="font-display text-xl font-medium dark:text-white">
                  {editing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h3>
                <button onClick={() => setFormOpen(false)} className="cursor-pointer text-slate-400 hover:text-ink dark:hover:text-white" aria-label="Đóng">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto px-7 py-6">
                {/* Image upload */}
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">Hình ảnh</p>
                  <div className="grid grid-cols-4 gap-3">
                    {(editing?.images ?? []).slice(0, 3).map((im, i) => (
                      <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-xl">
                        <img src={im} alt="" className="h-full w-full object-cover" />
                        <button className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <button className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-accent hover:text-accent-dark dark:border-white/15">
                      <UploadCloud size={20} />
                      <span className="text-[10px] font-semibold uppercase">Tải lên</span>
                    </button>
                  </div>
                </div>
                <FormField label="Tên sản phẩm" placeholder="VD: Áo khoác dạ Oversized" value={form.name} onChange={(e) => set('name', e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">Danh mục</label>
                    <select
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      className="w-full cursor-pointer rounded-input border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                    >
                      {CATEGORIES.map((c) => <option key={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <FormField label="Thương hiệu" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Giá bán (đ)" type="number" value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
                  <FormField label="Giá gốc (đ)" type="number" value={form.oldPrice} onChange={(e) => set('oldPrice', Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Tồn kho" type="number" value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} />
                  <FormField label="Chất liệu" value={form.material} onChange={(e) => set('material', e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">Mô tả</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Mô tả sản phẩm..."
                    className="w-full rounded-input border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                {/* Variants */}
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">Biến thể size</p>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
                      <label key={s} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold transition-all has-checked:border-ink has-checked:bg-ink has-checked:text-white dark:border-white/15 dark:text-white dark:has-checked:bg-white dark:has-checked:text-ink">
                        <input type="checkbox" defaultChecked={editing?.sizes.includes(s)} className="hidden" />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 px-7 py-5 dark:border-white/5">
                <Button variant="ghost" onClick={() => setFormOpen(false)}>Hủy</Button>
                <Button onClick={save}>{editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
