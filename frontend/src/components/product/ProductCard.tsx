import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Eye, ShoppingBag } from 'lucide-react'
import type { Product } from '@/types'
import { formatVND } from '@/data'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import Rating from '@/components/ui/Rating'

export default function ProductCard({
  product,
  onQuickView,
  index = 0,
}: {
  product: Product
  onQuickView?: (p: Product) => void
  index?: number
}) {
  const { add, setDrawerOpen } = useCart()
  const wishlist = useWishlist()
  const { toast } = useToast()
  const [hovered, setHovered] = useState(false)

  const salePercent = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0

  const quickAdd = () => {
    // add() trả false khi chưa đăng nhập (đã tự chuyển sang trang đăng nhập)
    // → không mở drawer giỏ hàng nữa
    if (add(product)) setDrawerOpen(true)
  }

  const toggleWish = () => {
    const added = wishlist.toggle(product.id)
    toast(added ? 'Đã thêm vào yêu thích ♥' : 'Đã xóa khỏi yêu thích', added ? 'success' : 'info')
  }

  const iconBtn =
    'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink shadow-lg backdrop-blur transition-all duration-300 hover:bg-ink hover:text-white'

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden rounded-img bg-slate-100 dark:bg-zinc-800">
        <Link to={`/san-pham/${product.id}`} className="block aspect-[3/4]">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition-all duration-700 ease-out ${
              hovered ? 'scale-105 opacity-0' : 'scale-100 opacity-100'
            }`}
          />
          <img
            src={product.images[1]}
            alt={product.name}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              hovered ? 'scale-105 opacity-100' : 'scale-110 opacity-0'
            }`}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isNew && (
            <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
              New
            </span>
          )}
          {salePercent > 0 && (
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-full bg-danger px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase"
            >
              -{salePercent}%
            </motion.span>
          )}
        </div>

        {/* Hover actions */}
        <div
          className={`absolute top-4 right-4 flex flex-col gap-2.5 transition-all duration-500 ${
            hovered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
          }`}
        >
          <button onClick={toggleWish} className={iconBtn} aria-label="Yêu thích" style={{ transitionDelay: '0ms' }}>
            <Heart size={16} className={wishlist.has(product.id) ? 'fill-danger text-danger' : ''} />
          </button>
          {onQuickView && (
            <button onClick={() => onQuickView(product)} className={iconBtn} aria-label="Xem nhanh">
              <Eye size={16} />
            </button>
          )}
        </div>

        {/* Quick add bar */}
        <div
          className={`absolute inset-x-4 bottom-4 transition-all duration-500 ${
            hovered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <button
            onClick={quickAdd}
            className="glass flex w-full cursor-pointer items-center justify-center gap-2 rounded-btn py-3 text-xs font-semibold tracking-widest text-ink uppercase shadow-xl transition-all duration-300 hover:bg-ink hover:text-white dark:text-white"
          >
            <ShoppingBag size={14} />
            Thêm vào giỏ
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 px-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">{product.category}</p>
          <Rating value={product.rating} size={11} />
        </div>
        <Link to={`/san-pham/${product.id}`}>
          <h3 className="line-clamp-1 text-sm font-medium transition-colors duration-300 hover:text-accent-dark dark:text-white">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold dark:text-white">
            {/* Biến thể khác giá nhau → hiện "từ ...đ" thay vì một con số dễ gây hiểu nhầm */}
            {product.hasPriceRange && <span className="mr-1 text-xs font-normal text-slate-400">từ</span>}
            {formatVND(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-xs text-slate-400 line-through">{formatVND(product.oldPrice)}</span>
          )}
        </div>
        {/* Color dots */}
        <div className="flex gap-1.5 pt-1">
          {product.colors.map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="h-3.5 w-3.5 rounded-full border border-slate-200 transition-transform duration-200 hover:scale-125 dark:border-white/20"
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
