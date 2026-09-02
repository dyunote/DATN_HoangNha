import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Star, Search } from 'lucide-react'
import { formatVND } from '@/data'
import { useCategories } from '@/hooks/useCategories'
import type { Product } from '@/types'
import { useProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/product/ProductCard'
import QuickViewModal from '@/components/product/QuickViewModal'
import EmptyState from '@/components/ui/EmptyState'
import Reveal from '@/components/ui/Reveal'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'

// Thứ tự size quen thuộc; size lạ (không nằm trong danh sách) xếp xuống cuối
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']
const PRICE_STEP = 50_000

const SORTS = [
  { value: 'featured', label: 'Nổi bật' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'bestseller', label: 'Bán chạy' },
]
const PER_PAGE = 12

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-6 first:pt-0 dark:border-white/10">
      <p className="label-section mb-4 dark:text-white">{title}</p>
      {children}
    </div>
  )
}

export default function Shop() {
  // Sản phẩm lấy từ database qua API
  const { products: PRODUCTS, loading } = useProducts()
  const { categories: CATEGORIES } = useCategories()
  const [params, setParams] = useSearchParams()
  const [quickView, setQuickView] = useState<Product | null>(null)
  const [mobileFilter, setMobileFilter] = useState(false)
  const [page, setPage] = useState(1)

  const category = params.get('loai') ?? ''
  const query = params.get('q') ?? ''
  const saleOnly = params.get('sale') === '1'
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  // null = chưa giới hạn giá. Không đặt sẵn một con số vì trần giá phụ thuộc
  // hàng đang có trong DB, chỉ biết được sau khi tải xong sản phẩm.
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState('featured')

  /**
   * Lựa chọn của bộ lọc dựng từ chính hàng trong DB, không liệt kê sẵn:
   * danh sách cứng vừa hiện màu/size shop không bán, vừa thiếu màu mới nhập.
   */
  const { colorOptions, sizeOptions, priceFloor, priceCeiling } = useMemo(() => {
    const colorMap = new Map<string, string>()
    const sizeSet = new Set<string>()
    let min = Infinity
    let max = 0
    for (const p of PRODUCTS) {
      p.colors?.forEach((c) => { if (!colorMap.has(c.name)) colorMap.set(c.name, c.hex) })
      p.sizes?.forEach((s) => sizeSet.add(s))
      if (p.price < min) min = p.price
      if (p.price > max) max = p.price
    }
    const round = (n: number, dir: 'floor' | 'ceil') => Math[dir](n / PRICE_STEP) * PRICE_STEP
    return {
      colorOptions: [...colorMap].map(([name, hex]) => ({ name, hex })),
      sizeOptions: [...sizeSet].sort((a, b) => {
        const ia = SIZE_ORDER.indexOf(a)
        const ib = SIZE_ORDER.indexOf(b)
        return (ia === -1 ? SIZE_ORDER.length : ia) - (ib === -1 ? SIZE_ORDER.length : ib) || a.localeCompare(b)
      }),
      priceFloor: max ? round(min, 'floor') : 0,
      // Trần luôn lớn hơn sàn ít nhất 1 nấc để thanh trượt không bị kẹt cứng
      priceCeiling: max ? Math.max(round(max, 'ceil'), round(min, 'floor') + PRICE_STEP) : PRICE_STEP,
    }
  }, [PRODUCTS])

  const toggleIn = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  const filtered = useMemo(() => {
    let list = [...PRODUCTS]
    if (category) {
      const cat = CATEGORIES.find((c) => c.slug === category)
      if (cat) list = list.filter((p) => p.category === cat.name)
    }
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    if (saleOnly) list = list.filter((p) => p.oldPrice)
    if (colors.length) list = list.filter((p) => p.colors.some((c) => colors.includes(c.name)))
    if (sizes.length) list = list.filter((p) => p.sizes.some((s) => sizes.includes(s)))
    if (maxPrice !== null) list = list.filter((p) => p.price <= maxPrice)
    if (minRating) list = list.filter((p) => p.rating >= minRating)
    switch (sort) {
      case 'newest': list.sort((a, b) => Number(b.isNew) - Number(a.isNew)); break
      case 'price-asc': list.sort((a, b) => a.price - b.price); break
      case 'price-desc': list.sort((a, b) => b.price - a.price); break
      case 'rating': list.sort((a, b) => b.rating - a.rating); break
      case 'bestseller': list.sort((a, b) => b.sold - a.sold); break
    }
    return list
  }, [PRODUCTS, category, query, saleOnly, colors, sizes, maxPrice, minRating, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const activeCount = colors.length + sizes.length + (maxPrice !== null ? 1 : 0) + (minRating ? 1 : 0)

  const clearAll = () => {
    setColors([]); setSizes([]); setMaxPrice(null); setMinRating(0)
    setParams({})
  }

  const filters = (
    <>
      <FilterGroup title="Danh mục">
        <div className="space-y-2.5">
          <button
            onClick={() => { setParams((p) => { p.delete('loai'); return p }); setPage(1) }}
            className={`block cursor-pointer text-sm transition-colors hover:text-accent-dark ${!category ? 'font-semibold text-accent-dark' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Tất cả sản phẩm
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setParams((p) => { p.set('loai', c.slug); return p }); setPage(1) }}
              className={`flex w-full cursor-pointer items-center justify-between text-sm transition-colors hover:text-accent-dark ${category === c.slug ? 'font-semibold text-accent-dark' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {c.name} <span className="text-xs text-slate-300">{c.count}</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Khoảng giá">
        <input
          type="range"
          min={priceFloor}
          max={priceCeiling}
          step={PRICE_STEP}
          value={maxPrice ?? priceCeiling}
          // Kéo hết sang phải = không lọc giá nữa, không phải "lọc ≤ giá cao nhất"
          onChange={(e) => {
            const v = Number(e.target.value)
            setMaxPrice(v >= priceCeiling ? null : v)
            setPage(1)
          }}
          className="w-full cursor-pointer accent-[#D6B98C]"
        />
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{formatVND(priceFloor)}</span>
          <span className="font-semibold text-ink dark:text-white">≤ {formatVND(maxPrice ?? priceCeiling)}</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Màu sắc">
        <div className="flex flex-wrap gap-2.5">
          {colorOptions.map((c) => (
            <button
              key={c.name}
              title={c.name}
              onClick={() => { toggleIn(colors, setColors, c.name); setPage(1) }}
              className={`h-8 w-8 cursor-pointer rounded-full border-2 transition-all hover:scale-110 ${
                colors.includes(c.name) ? 'border-accent ring-2 ring-accent/30' : 'border-slate-200 dark:border-white/15'
              }`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Kích cỡ">
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((s) => (
            <button
              key={s}
              onClick={() => { toggleIn(sizes, setSizes, s); setPage(1) }}
              className={`cursor-pointer rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                sizes.includes(s)
                  ? 'border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink'
                  : 'border-slate-200 text-slate-500 hover:border-ink dark:border-white/15 dark:text-slate-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Đánh giá">
        <div className="space-y-2">
          {[4.5, 4, 3].map((r) => (
            <button
              key={r}
              onClick={() => { setMinRating(minRating === r ? 0 : r); setPage(1) }}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                minRating === r ? 'bg-accent/15 font-semibold text-accent-dark' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'
              }`}
            >
              <Star size={14} className="fill-accent text-accent" /> Từ {r} sao trở lên
            </button>
          ))}
        </div>
      </FilterGroup>

      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="mt-6 w-full cursor-pointer rounded-btn border border-slate-200 py-3 text-xs font-semibold tracking-widest uppercase transition-all hover:border-danger hover:text-danger dark:border-white/15 dark:text-white"
        >
          Xóa bộ lọc ({activeCount})
        </button>
      )}
    </>
  )

  const catName = CATEGORIES.find((c) => c.slug === category)?.name

  return (
    <div className="pt-16 lg:pt-20">
      {/* Page banner */}
      <div className="relative overflow-hidden bg-ink py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-[10%] h-64 w-64 rounded-full bg-accent/15 blur-[90px]" />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <Reveal direction="up">
            <p className="label-eyebrow text-accent">
              {saleOnly ? 'Ưu đãi đặc biệt' : 'Bộ sưu tập'}
            </p>
          </Reveal>
          <Reveal direction="up" delay={0.1}>
            <h1 className="title-page mt-3 text-white">
              {query ? `Kết quả cho “${query}”` : saleOnly ? 'Sale cuối mùa' : (catName ?? 'Tất cả sản phẩm')}
            </h1>
          </Reveal>
          <Reveal direction="up" delay={0.18}>
            <p className="mt-4 text-sm text-white/50">{filtered.length} sản phẩm</p>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">{filters}</div>
          </aside>

          <div>
            {/* Toolbar */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => setMobileFilter(true)}
                className="flex cursor-pointer items-center gap-2 rounded-btn border border-slate-200 px-5 py-2.5 text-xs font-semibold tracking-widest uppercase lg:hidden dark:border-white/15 dark:text-white"
              >
                <SlidersHorizontal size={15} /> Bộ lọc {activeCount > 0 && `(${activeCount})`}
              </button>
              <p className="hidden text-sm text-muted lg:block">
                Hiển thị <span className="font-semibold text-ink dark:text-white">{paged.length}</span> / {filtered.length} sản phẩm
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer rounded-btn border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent dark:border-white/15 dark:bg-zinc-900 dark:text-white"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>Sắp xếp: {s.label}</option>
                ))}
              </select>
            </div>

            {/* Grid */}
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : paged.length === 0 ? (
              <EmptyState
                icon={<Search size={32} />}
                title="Không tìm thấy sản phẩm"
                description="Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn."
              />
            ) : (
              <motion.div layout className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-4 xl:gap-x-7 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {paged.map((p, i) => (
                    <motion.div key={p.id} layout exit={{ opacity: 0, scale: 0.9 }}>
                      <ProductCard product={p} index={i} onQuickView={setQuickView} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-btn border border-slate-200 transition-all hover:border-ink disabled:opacity-30 dark:border-white/15 dark:text-white"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setPage(i + 1); window.scrollTo({ top: 300, behavior: 'smooth' }) }}
                    className={`h-11 w-11 cursor-pointer rounded-btn text-sm font-semibold transition-all ${
                      safePage === i + 1
                        ? 'bg-ink text-white shadow-xl dark:bg-white dark:text-ink'
                        : 'border border-slate-200 hover:border-ink dark:border-white/15 dark:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-btn border border-slate-200 transition-all hover:border-ink disabled:opacity-30 dark:border-white/15 dark:text-white"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFilter && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFilter(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-[85] w-[85%] max-w-sm overflow-y-auto bg-white px-6 py-6 lg:hidden dark:bg-zinc-950"
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="font-display text-xl font-medium dark:text-white">Bộ lọc</p>
                <button onClick={() => setMobileFilter(false)} className="cursor-pointer dark:text-white" aria-label="Đóng">
                  <X size={22} />
                </button>
              </div>
              {filters}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  )
}
