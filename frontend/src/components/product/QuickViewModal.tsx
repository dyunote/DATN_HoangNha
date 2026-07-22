import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react'
import type { Product } from '@/types'
import { formatVND } from '@/data'
import Modal from '@/components/ui/Modal'
import Rating from '@/components/ui/Rating'
import Button from '@/components/ui/Button'
import QuantityStepper from '@/components/ui/QuantityStepper'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import { getVariantPrice, getVariantOldPrice, sizesInStock } from '@/lib/variant'

export default function QuickViewModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { add, setDrawerOpen } = useCart()
  const wishlist = useWishlist()
  const { toast } = useToast()
  const [size, setSize] = useState<string>()
  const [color, setColor] = useState<string>()
  const [qty, setQty] = useState(1)
  const [img, setImg] = useState(0)

  if (!product) return null

  // Giá + tồn kho theo biến thể đang chọn
  const activeColor = color ?? product.colors[0]?.name
  const activeSize = size ?? product.sizes[0]
  const activePrice = getVariantPrice(product, activeSize, activeColor)
  const activeOldPrice = getVariantOldPrice(product, activeSize, activeColor)
  const availableSizes = sizesInStock(product, activeColor)

  const addToCart = () => {
    const ok = add(product, qty, size ?? product.sizes[0], color ?? product.colors[0].name)
    onClose() // luôn đóng modal, kể cả khi bị chuyển sang trang đăng nhập
    if (ok) setDrawerOpen(true)
  }

  return (
    <Modal open={!!product} onClose={onClose}>
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-[3/4] overflow-hidden md:rounded-l-card">
          <img src={product.images[img]} alt={product.name} className="h-full w-full object-cover" />
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {product.images.slice(0, 4).map((_, i) => (
              <button
                key={i}
                onClick={() => setImg(i)}
                className={`h-1.5 cursor-pointer rounded-full transition-all ${i === img ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center p-8 lg:p-10">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-accent-dark uppercase">{product.brand}</p>
          <h3 className="font-display mt-2 text-2xl font-medium lg:text-3xl dark:text-white">{product.name}</h3>
          <div className="mt-3 flex items-center gap-3">
            <Rating value={product.rating} showValue />
            <span className="text-xs text-slate-400">({product.reviewCount} đánh giá)</span>
          </div>
          {/* Giá cập nhật theo biến thể size × màu đang chọn */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold dark:text-white">{formatVND(activePrice)}</span>
            {activeOldPrice && activeOldPrice > activePrice && (
              <span className="text-sm text-slate-400 line-through">{formatVND(activeOldPrice)}</span>
            )}
          </div>
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {product.description}
          </p>

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold tracking-widest uppercase dark:text-white">Màu sắc</p>
            <div className="flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  title={c.name}
                  className={`h-8 w-8 cursor-pointer rounded-full border-2 transition-all hover:scale-110 ${
                    (color ?? product.colors[0].name) === c.name ? 'border-accent ring-2 ring-accent/30' : 'border-slate-200 dark:border-white/20'
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold tracking-widest uppercase dark:text-white">Kích cỡ</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const soldOut = !availableSizes.has(s)
                return (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    disabled={soldOut}
                    className={`min-w-11 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                      soldOut
                        ? 'cursor-not-allowed border-slate-100 text-slate-300 line-through dark:border-white/5 dark:text-slate-600'
                        : activeSize === s
                          ? 'cursor-pointer border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink'
                          : 'cursor-pointer border-slate-200 hover:border-ink dark:border-white/15 dark:text-white'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} />
            <Button className="flex-1" onClick={addToCart}>
              <ShoppingBag size={15} /> Thêm vào giỏ
            </Button>
            <button
              onClick={() => {
                const added = wishlist.toggle(product.id)
                toast(added ? 'Đã thêm vào yêu thích ♥' : 'Đã xóa khỏi yêu thích', 'info')
              }}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-btn border border-slate-200 transition-all hover:border-danger hover:text-danger dark:border-white/15 dark:text-white"
            >
              <Heart size={17} className={wishlist.has(product.id) ? 'fill-danger text-danger' : ''} />
            </button>
          </div>

          <Link
            to={`/san-pham/${product.id}`}
            onClick={onClose}
            className="link-underline group mt-6 inline-flex items-center gap-2 self-start text-xs font-semibold tracking-widest uppercase dark:text-white"
          >
            Xem chi tiết sản phẩm
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </Modal>
  )
}
