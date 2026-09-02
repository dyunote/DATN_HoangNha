import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Heart, ShoppingBag, Zap, RefreshCw, Truck, ShieldCheck, ChevronRight, Rotate3d, Minus, Plus,
} from 'lucide-react'
import { formatVND } from '@/data'
import { getVariantPrice, getVariantOldPrice, getVariantStock, sizesInStock, colorsInStock, colorHasAnyStock } from '@/lib/variant'
import type { Product, Review } from '@/types'
import { useProducts } from '@/hooks/useProducts'
import { productApi, meApi, type ReviewEligibility } from '@/api/services'
import { apiMessage } from '@/api/error'
import { Star, BadgeCheck, Lock } from 'lucide-react'
import Rating from '@/components/ui/Rating'
import Button from '@/components/ui/Button'
import Accordion from '@/components/ui/Accordion'
import ProductCard from '@/components/product/ProductCard'
import QuickViewModal from '@/components/product/QuickViewModal'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'

/**
 * "Đã xem gần đây" tách theo TÀI KHOẢN.
 * LỖI CŨ: cả máy dùng chung một khóa 'hn-recent' nên đăng nhập tài khoản khác
 * vẫn thấy đồ người trước vừa xem.
 * KHÔNG đồng bộ lên server: đây là tiện ích duyệt web của từng thiết bị, khác
 * với giỏ hàng và danh sách yêu thích (hai thứ đó là dữ liệu của tài khoản).
 */
const recentKey = (email?: string) => (email ? `hn-recent:${email}` : 'hn-recent:guest')
/** Khóa dùng chung của bản cũ — dọn đi để không còn ai đọc nhầm */
const LEGACY_RECENT_KEY = 'hn-recent'

const readRecent = (email?: string): number[] => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(recentKey(email)) || '[]')
    return Array.isArray(raw) ? raw.filter((v): v is number => typeof v === 'number') : []
  } catch {
    return []
  }
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Sản phẩm lấy từ database qua API
  const { products: PRODUCTS } = useProducts()
  const product = PRODUCTS.find((p) => p.id === Number(id))
  const { user } = useAuth()
  const { add, setDrawerOpen } = useCart()
  const wishlist = useWishlist()
  const { toast } = useToast()

  const [img, setImg] = useState(0)
  const [size, setSize] = useState<string>()
  const [color, setColor] = useState<string>()
  const [qty, setQty] = useState(1)
  const [zoom, setZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [spin, setSpin] = useState(false)
  const [quickView, setQuickView] = useState<Product | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  // UC-08: đánh giá đã duyệt, lấy từ database
  const [reviews, setReviews] = useState<Review[]>([])
  const [myRating, setMyRating] = useState(5)
  const [myContent, setMyContent] = useState('')
  const [sending, setSending] = useState(false)
  /**
   * Khách có được đánh giá sản phẩm này không — SERVER quyết định.
   * null = chưa hỏi xong (hoặc chưa đăng nhập nên không hỏi).
   */
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null)
  /** Đánh giá thay cho lượt mua nào (mã đơn) — khách mua nhiều lần thì được chọn */
  const [reviewFor, setReviewFor] = useState('')

  useEffect(() => {
    if (!id) return
    productApi
      .reviews(Number(id))
      .then((data: Review[]) => setReviews(data))
      .catch(() => {})
  }, [id])

  // Chỉ hỏi khi đã đăng nhập — khách vãng lai chắc chắn không đánh giá được,
  // gọi API chỉ tổ nhận 401.
  useEffect(() => {
    if (!id || !user) {
      setEligibility(null)
      return
    }
    meApi
      .reviewEligibility(Number(id))
      .then((data) => {
        setEligibility(data)
        setReviewFor(data.options[0]?.orderId ?? '')
      })
      .catch(() => setEligibility(null))
  }, [id, user])

  // UC-23: gửi đánh giá (chờ admin duyệt).
  // Chỉ gọi được khi server đã xác nhận khách có đơn GIAO THÀNH CÔNG chứa
  // sản phẩm này — server vẫn kiểm lại lần nữa, đây không phải hàng rào.
  const submitReview = () => {
    if (!myContent.trim()) {
      toast('Vui lòng nhập nội dung đánh giá', 'warning')
      return
    }
    const chosen = eligibility?.options.find((o) => o.orderId === reviewFor) ?? eligibility?.options[0]
    if (!chosen) {
      toast('Không tìm thấy đơn hàng đủ điều kiện đánh giá', 'warning')
      return
    }
    setSending(true)
    meApi
      // Gửi kèm đơn + biến thể ĐÃ MUA (không phải biến thể đang xem): đánh giá
      // phải gắn đúng món khách thật sự nhận được.
      .addReview({
        productId: Number(id),
        rating: myRating,
        content: myContent.trim(),
        orderId: chosen.orderId,
        variantId: chosen.variantId,
      })
      .then(() => {
        toast('Cảm ơn bạn! Đánh giá sẽ hiển thị sau khi được duyệt ✓')
        setMyContent('')
        // Đơn vừa đánh giá không được đánh giá lần nữa → nạp lại điều kiện
        return meApi.reviewEligibility(Number(id)).then((data) => {
          setEligibility(data)
          setReviewFor(data.options[0]?.orderId ?? '')
        })
      })
      // Gửi hỏng thì giữ nguyên nội dung đã gõ để khách gửi lại, không xóa trắng
      .catch((err) => toast(apiMessage(err, 'Gửi đánh giá thất bại'), 'error'))
      .finally(() => setSending(false))
  }

  // Đọc lại khi đổi sản phẩm HOẶC đổi tài khoản — mỗi tài khoản một lịch sử riêng.
  // `id` cố tình nằm trong deps dù hàm không dùng tới: xem xong sản phẩm này rồi
  // bấm sang sản phẩm khác thì danh sách phải đọc lại từ localStorage vừa ghi.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recent = useMemo<number[]>(() => readRecent(user?.email), [id, user?.email])

  useEffect(() => {
    setImg(0); setSize(undefined); setColor(undefined); setQty(1)
    if (product) {
      const list = [product.id, ...recent.filter((x) => x !== product.id)].slice(0, 8)
      try {
        localStorage.setItem(recentKey(user?.email), JSON.stringify(list))
        // Dọn khóa dùng chung của bản cũ ngay lần đầu ghi
        localStorage.removeItem(LEGACY_RECENT_KEY)
      } catch {
        // Hết dung lượng — chỉ mất lịch sử xem, không ảnh hưởng gì khác
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.email])

  if (!product) {
    return (
      <div className="pt-20">
        <EmptyState
          icon={<ShoppingBag size={32} />}
          title="Không tìm thấy sản phẩm"
          description="Sản phẩm không tồn tại hoặc đã ngừng kinh doanh."
          actionLabel="Về trang mua sắm"
          actionTo="/danh-muc"
        />
      </div>
    )
  }

  // Size/màu đang chọn (chưa chọn thì lấy mặc định đầu tiên)
  const activeColor = color ?? product.colors[0]?.name
  const activeSize = size ?? product.sizes[0]
  // Giá + tồn kho tra theo đúng biến thể → đổi size/màu là giá đổi theo
  const activePrice = getVariantPrice(product, activeSize, activeColor)
  const activeOldPrice = getVariantOldPrice(product, activeSize, activeColor)
  const activeStock = getVariantStock(product, activeSize, activeColor)
  const availableSizes = sizesInStock(product, activeColor)
  // Màu nào hết sạch (mọi size) thì khóa hẳn; màu còn hàng ở size khác thì vẫn
  // chọn được — chọn xong danh sách size sẽ tự cập nhật theo màu đó.
  const availableColors = colorsInStock(product, activeSize)
  /** Hết hàng biến thể đang chọn → khóa nút mua, KHÔNG khóa cả sản phẩm */
  const variantSoldOut = activeStock <= 0

  const salePercent = activeOldPrice ? Math.round((1 - activePrice / activeOldPrice) * 100) : 0
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
  const recentProducts = recent
    .filter((x) => x !== product.id)
    .map((x) => PRODUCTS.find((p) => p.id === x))
    .filter((p): p is Product => !!p)
    .slice(0, 4)

  const onImgMove = (e: MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect()
    if (!rect) return
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  // add() trả false khi chưa đăng nhập HOẶC khi vượt tồn kho biến thể
  const addToCart = () => {
    if (add(product, qty, activeSize, activeColor)) setDrawerOpen(true)
  }

  const buyNow = () => {
    // Chỉ sang trang thanh toán khi thêm giỏ thành công
    if (add(product, qty, activeSize, activeColor)) navigate('/thanh-toan')
  }

  const lowStock = activeStock < 10

  return (
    <div className="pt-16 lg:pt-20">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-14">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-xs text-muted">
          <Link to="/" className="transition-colors hover:text-ink dark:hover:text-white">Trang chủ</Link>
          <ChevronRight size={12} />
          <Link to="/danh-muc" className="transition-colors hover:text-ink dark:hover:text-white">Bộ sưu tập</Link>
          <ChevronRight size={12} />
          <span className="font-medium text-ink dark:text-white">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div className="flex flex-col-reverse gap-4 sm:flex-row">
            <div className="flex gap-3 sm:flex-col">
              {product.images.map((im, i) => (
                <button
                  key={i}
                  onClick={() => { setImg(i); setSpin(false) }}
                  className={`img-zoom h-20 w-16 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 transition-all sm:h-24 sm:w-20 ${
                    img === i && !spin ? 'border-accent shadow-lg shadow-accent/20' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={im} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              <button
                onClick={() => setSpin((s) => !s)}
                title="Xem 360°"
                className={`flex h-20 w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 text-[9px] font-semibold tracking-wider uppercase transition-all sm:h-24 sm:w-20 ${
                  spin ? 'border-accent bg-accent/10 text-accent-dark' : 'border-dashed border-slate-300 text-muted hover:border-accent hover:text-accent-dark dark:border-white/20'
                }`}
              >
                <Rotate3d size={20} /> 360°
              </button>
            </div>

            <div
              ref={imgRef}
              className="relative flex-1 cursor-zoom-in overflow-hidden rounded-img bg-slate-100 dark:bg-zinc-800"
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onMouseMove={onImgMove}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={spin ? 'spin' : img}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="aspect-[3/4]"
                >
                  {spin ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <motion.img
                        src={product.images[0]}
                        alt={product.name}
                        animate={{ rotateY: 360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                        className="h-full w-full object-cover"
                        style={{ transformStyle: 'preserve-3d' }}
                      />
                      <span className="glass absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase">
                        Chế độ xem 360°
                      </span>
                    </div>
                  ) : (
                    <img
                      src={product.images[img]}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-200"
                      style={
                        zoom
                          ? { transform: 'scale(1.8)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                          : undefined
                      }
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="absolute top-5 left-5 flex flex-col gap-2">
                {(product.showNewBadge ?? product.isNew) && (
                  <span className="rounded-full bg-ink px-3.5 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase">New</span>
                )}
                {salePercent > 0 && (
                  <span className="rounded-full bg-danger px-3.5 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase">
                    -{salePercent}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sticky buy box */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="label-eyebrow text-accent-dark">{product.brand}</p>
              <h1 className="title-page mt-3 dark:text-white">
                {product.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Rating value={product.rating} size={16} showValue />
                <span className="text-sm text-muted">({product.reviewCount} đánh giá)</span>
                <span className="text-sm text-muted">· Đã bán {product.sold}</span>
              </div>

              {/* Giá đổi theo biến thể đang chọn — key giúp React chạy lại animation
                  mỗi khi giá thay đổi, khách nhận ra ngay là giá vừa khác */}
              <motion.div
                key={activePrice}
                initial={{ opacity: 0.4, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-6 flex flex-wrap items-baseline gap-3"
              >
                <span className="font-display text-4xl font-semibold dark:text-white">{formatVND(activePrice)}</span>
                {activeOldPrice && activeOldPrice > activePrice && (
                  <>
                    <span className="text-lg text-muted line-through">{formatVND(activeOldPrice)}</span>
                    <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-bold text-danger">
                      Tiết kiệm {formatVND(activeOldPrice - activePrice)}
                    </span>
                  </>
                )}
              </motion.div>

              {/* Báo cho khách biết giá phụ thuộc lựa chọn, tránh cảm giác "giá nhảy lung tung" */}
              {product.hasPriceRange && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Giá thay đổi theo kích cỡ / màu sắc bạn chọn
                </p>
              )}

              {/* Tồn kho của riêng biến thể đang chọn */}
              <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold ${
                activeStock === 0
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  : lowStock ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  activeStock === 0 ? 'bg-slate-400' : lowStock ? 'animate-pulse bg-warning' : 'bg-success'
                }`} />
                {activeStock === 0
                  ? 'Hết hàng phiên bản này'
                  : lowStock ? `Chỉ còn ${activeStock} sản phẩm` : `Còn hàng (${activeStock})`}
              </div>

              {/* Colors */}
              <div className="mt-8">
                <p className="label-section mb-3 dark:text-white">
                  Màu sắc: <span className="font-normal text-muted normal-case">{color ?? product.colors[0].name}</span>
                </p>
                <div className="flex gap-3">
                  {product.colors.map((c) => {
                    // Chỉ khóa hẳn màu đã hết sạch ở MỌI size. Màu còn hàng ở
                    // size khác thì vẫn cho chọn, chỉ làm mờ để báo hiệu.
                    const soldOutEverywhere = !colorHasAnyStock(product, c.name)
                    const soldOutHere = !availableColors.has(c.name)
                    return (
                      <button
                        key={c.name}
                        onClick={() => setColor(c.name)}
                        disabled={soldOutEverywhere}
                        title={soldOutEverywhere ? `${c.name} — hết hàng` : soldOutHere ? `${c.name} — hết size ${activeSize}` : c.name}
                        className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                          soldOutEverywhere
                            ? 'cursor-not-allowed opacity-35'
                            : `cursor-pointer hover:scale-110 ${soldOutHere ? 'opacity-55' : ''}`
                        } ${
                          activeColor === c.name
                            ? 'border-accent shadow-lg shadow-accent/30 ring-2 ring-accent/25'
                            : 'border-slate-200 dark:border-white/20'
                        }`}
                        style={{ background: c.hex }}
                      >
                        {/* Gạch chéo cho màu đã hết sạch — nhìn là biết ngay */}
                        {soldOutEverywhere && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="h-[2px] w-8 rotate-45 rounded bg-danger" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sizes */}
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <p className="label-section dark:text-white">Kích cỡ</p>
                  {/* Trước đây là <button> không làm gì cả — giờ mở trang hướng dẫn thật */}
                  <Link to="/huong-dan-chon-size" className="link-underline text-xs text-muted">
                    Hướng dẫn chọn size
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((s) => {
                    const soldOut = !availableSizes.has(s)
                    // Chênh lệch so với giá thấp nhất — hiện "+50k" để khách
                    // biết trước size nào đắt hơn mà không cần bấm thử từng cái
                    const diff = getVariantPrice(product, s, activeColor) - (product.minPrice ?? product.price)
                    return (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        disabled={soldOut}
                        title={soldOut ? 'Hết hàng' : undefined}
                        className={`min-w-12 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                          soldOut
                            ? 'cursor-not-allowed border-slate-100 text-slate-300 line-through dark:border-white/5 dark:text-slate-600'
                            : activeSize === s
                              ? 'cursor-pointer border-ink bg-ink text-white shadow-lg dark:border-white dark:bg-white dark:text-ink'
                              : 'cursor-pointer border-slate-200 hover:border-ink dark:border-white/15 dark:text-white dark:hover:border-white'
                        }`}
                      >
                        {s}
                        {!soldOut && diff > 0 && (
                          <span className="ml-1 text-[10px] font-medium opacity-70">
                            +{Math.round(diff / 1000)}k
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quantity + CTA */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="inline-flex h-13 items-center rounded-btn border border-slate-200 dark:border-white/15">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-13 w-12 cursor-pointer items-center justify-center text-slate-500 hover:text-ink dark:hover:text-white">
                    <Minus size={15} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold dark:text-white">{qty}</span>
                  {/* Không cho tăng quá tồn kho của ĐÚNG biến thể đang chọn */}
                  <button
                    onClick={() => setQty((q) => Math.min(q + 1, Math.max(1, activeStock)))}
                    disabled={qty >= activeStock}
                    className="flex h-13 w-12 cursor-pointer items-center justify-center text-slate-500 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-white"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <Button size="lg" className="h-13 flex-1" onClick={addToCart} disabled={variantSoldOut}>
                  <ShoppingBag size={16} /> {variantSoldOut ? 'Hết hàng phiên bản này' : 'Thêm vào giỏ'}
                </Button>
                <button
                  onClick={() => {
                    const added = wishlist.toggle(product.id)
                    toast(added ? 'Đã thêm vào yêu thích ♥' : 'Đã xóa khỏi yêu thích', 'info')
                  }}
                  className="flex h-13 w-13 shrink-0 cursor-pointer items-center justify-center rounded-btn border border-slate-200 transition-all hover:border-danger hover:text-danger dark:border-white/15 dark:text-white"
                  aria-label="Yêu thích"
                >
                  <Heart size={18} className={wishlist.has(product.id) ? 'fill-danger text-danger' : ''} />
                </button>
              </div>
              <Button variant="accent" size="lg" className="mt-3 h-13 w-full" onClick={buyNow} disabled={variantSoldOut}>
                <Zap size={16} /> Mua ngay
              </Button>

              {/* Trust badges */}
              <div className="mt-8 grid grid-cols-3 gap-4 rounded-card bg-slate-50 p-5 dark:bg-white/5">
                {[
                  { icon: <Truck size={18} />, text: 'Freeship đơn từ 500K' },
                  { icon: <RefreshCw size={18} />, text: 'Đổi trả trong 30 ngày' },
                  { icon: <ShieldCheck size={18} />, text: 'Bảo hành đường may' },
                ].map((b, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 text-center">
                    <span className="text-accent-dark">{b.icon}</span>
                    <span className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Accordion */}
              <div className="mt-8">
                <Accordion
                  items={[
                    { title: 'Mô tả sản phẩm', content: product.description },
                    {
                      title: 'Thông số chi tiết',
                      content: (
                        <ul className="space-y-2">
                          <li><b className="font-medium text-ink dark:text-white">Chất liệu:</b> {product.material}</li>
                          <li><b className="font-medium text-ink dark:text-white">Thương hiệu:</b> {product.brand}</li>
                          <li><b className="font-medium text-ink dark:text-white">Xuất xứ:</b> Việt Nam</li>
                          <li><b className="font-medium text-ink dark:text-white">Bảo quản:</b> Giặt tay hoặc giặt máy chế độ nhẹ, không dùng chất tẩy.</li>
                        </ul>
                      ),
                    },
                    {
                      title: 'Vận chuyển & Đổi trả',
                      content:
                        'Giao hàng toàn quốc 1-4 ngày. Miễn phí vận chuyển cho đơn từ 500.000đ. Đổi trả miễn phí trong 30 ngày nếu sản phẩm còn nguyên tem mác.',
                    },
                    {
                      title: `Đánh giá (${product.reviewCount})`,
                      content: (
                        <div className="space-y-5">
                          {reviews.map((r) => (
                            <div key={r.id} className="flex gap-4">
                              <img src={r.avatar ?? undefined} alt={r.author} className="h-10 w-10 rounded-full object-cover" />
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="text-sm font-semibold text-ink dark:text-white">{r.author}</p>
                                  <Rating value={r.rating} size={11} />
                                  {/* Biến thể đã mua — có được nhờ reviews nối vào variants.
                                      Giúp người sau biết size đó rộng hay chật. */}
                                  {/* Badge xác thực: chỉ hiện khi đánh giá gắn
                                      với một đơn đã giao thành công. */}
                                  {r.verifiedPurchase && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                                      <BadgeCheck size={11} /> Đã mua hàng
                                    </span>
                                  )}
                                  {r.variant && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
                                      {r.variant}
                                    </span>
                                  )}
                                </div>
                                {r.title && <p className="mt-1 text-sm font-semibold dark:text-white">{r.title}</p>}
                                <p className="mt-1 text-sm">{r.content}</p>
                                <p className="mt-1 text-[10px] tracking-wider text-muted uppercase">{r.date}</p>
                              </div>
                            </div>
                          ))}

                          {/* UC-23: form gửi đánh giá — CHỈ hiện khi server xác
                              nhận khách đã mua và đã nhận hàng. Chưa đủ điều
                              kiện thì thay bằng dòng giải thích, không hiện form
                              rồi để khách gõ xong mới báo lỗi. */}
                          {!eligibility?.canReview ? (
                            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
                              <Lock size={16} className="mt-0.5 shrink-0" />
                              <p>
                                {!user
                                  ? 'Chỉ khách đã mua sản phẩm này mới có thể đánh giá. Vui lòng đăng nhập bằng tài khoản đã đặt hàng.'
                                  : (eligibility?.reason ?? 'Chỉ khách đã mua sản phẩm này mới có thể đánh giá.')}
                              </p>
                            </div>
                          ) : (
                          <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                            <p className="text-xs font-semibold tracking-widest text-ink uppercase dark:text-white">
                              Viết đánh giá của bạn
                            </p>
                            {/* Mua nhiều lần thì chọn đánh giá cho đơn nào —
                                mỗi đơn chỉ đánh giá được một lần. */}
                            {eligibility.options.length > 1 ? (
                              <select
                                value={reviewFor}
                                onChange={(e) => setReviewFor(e.target.value)}
                                className="mt-3 w-full cursor-pointer rounded-input border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                              >
                                {eligibility.options.map((o) => (
                                  <option key={`${o.orderId}-${o.variantId}`} value={o.orderId}>
                                    Đơn #{o.orderId} — {o.color} / {o.size}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="mt-1.5 text-[11px] text-muted">
                                Đánh giá cho đơn #{eligibility.options[0].orderId} ({eligibility.options[0].color} / {eligibility.options[0].size})
                              </p>
                            )}
                            <div className="mt-3 flex gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setMyRating(s)}
                                  className="cursor-pointer transition-transform hover:scale-125"
                                  aria-label={`${s} sao`}
                                >
                                  <Star
                                    size={20}
                                    className={s <= myRating ? 'fill-accent text-accent' : 'text-slate-300 dark:text-slate-600'}
                                  />
                                </button>
                              ))}
                            </div>
                            <textarea
                              rows={3}
                              value={myContent}
                              onChange={(e) => setMyContent(e.target.value)}
                              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                              className="mt-3 w-full rounded-input border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-accent dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                            />
                            <div className="mt-3 flex justify-end">
                              <Button size="sm" onClick={submitReview} disabled={sending}>
                                {sending ? 'Đang gửi…' : 'Gửi đánh giá'}
                              </Button>
                            </div>
                          </div>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Related */}
        <div className="mt-24">
          <h2 className="title-section mb-10 dark:text-white">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickView} />
            ))}
          </div>
        </div>

        {/* Recently viewed */}
        {recentProducts.length > 0 && (
          <div className="mt-24">
            <h2 className="title-section mb-10 dark:text-white">Đã xem gần đây</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
              {recentProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickView} />
              ))}
            </div>
          </div>
        )}
      </div>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  )
}
