import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, Heart, ShoppingBag, User, Bell, Sun, Moon, Menu, X, ChevronDown, ArrowRight, ShieldCheck,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import { NOTIFICATIONS, formatVND } from '@/data'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'

const NAV = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Cửa hàng', to: '/danh-muc', mega: true },
  { label: 'Nữ', to: '/danh-muc?gioi-tinh=nu' },
  { label: 'Nam', to: '/danh-muc?gioi-tinh=nam' },
  { label: 'Sale', to: '/danh-muc?sale=1', hot: true },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const lastY = useRef(0)
  const CATEGORIES = useCategories()
  const { products: PRODUCTS } = useProducts()
  const { dark, toggle } = useTheme()
  const { count, setDrawerOpen } = useCart()
  const wishlist = useWishlist()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isHome = location.pathname === '/'
  const solid = scrolled || !isHome || megaOpen || mobileOpen

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      setHidden(y > 400 && y > lastY.current)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setMegaOpen(false)
    setNotifOpen(false)
  }, [location])

  const results = query.trim()
    ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : []

  const iconCls = `relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all duration-300 hover:bg-ink/5 dark:hover:bg-white/10 ${
    solid ? 'text-ink dark:text-white' : 'text-white'
  }`

  const unread = NOTIFICATIONS.filter((n) => !n.read).length

  return (
    <>
      <motion.header
        animate={{ y: hidden ? '-100%' : '0%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid
            ? 'border-b border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-zinc-950/80'
            : 'bg-transparent'
        }`}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-10">
          {/* Mobile menu btn */}
          <button className={`${iconCls} lg:hidden`} onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>

          {/* Logo: ảnh HN + tên thương hiệu. rounded-full vì logo vốn hình tròn,
              cắt tròn giúp nền kem của ảnh không lộ thành ô vuông trên nền tối */}
          <Link to="/" className="group flex items-center gap-2.5">
            <img
              src="/favicon.png"
              alt="Logo Hoàng Nha"
              className="h-9 w-9 rounded-full object-cover ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10"
            />
            <span
              className={`font-display text-xl font-semibold tracking-wide transition-colors duration-500 sm:text-2xl ${
                solid ? 'text-ink dark:text-white' : 'text-white'
              }`}
            >
              Hoàng Nha
              <span className="text-accent">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <div key={item.label} onMouseEnter={() => setMegaOpen(!!item.mega)} className="relative">
                <NavLink
                  to={item.to}
                  className={`link-underline inline-flex items-center gap-1 py-2 text-[13px] font-semibold tracking-[0.12em] uppercase transition-colors duration-500 ${
                    solid ? 'text-ink dark:text-white' : 'text-white'
                  } ${item.hot ? '!text-danger' : ''}`}
                  data-active={location.pathname + location.search === item.to}
                >
                  {item.label}
                  {item.mega && <ChevronDown size={13} className={`transition-transform duration-300 ${megaOpen ? 'rotate-180' : ''}`} />}
                </NavLink>
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <button className={iconCls} onClick={() => setSearchOpen(true)} aria-label="Tìm kiếm">
              <Search size={18} />
            </button>
            <button className={iconCls} onClick={toggle} aria-label="Đổi giao diện">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={dark ? 'sun' : 'moon'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>
            <div className="relative hidden sm:block">
              <button className={iconCls} onClick={() => setNotifOpen((o) => !o)} aria-label="Thông báo">
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative h-2 w-2 rounded-full bg-accent" />
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    className="absolute right-0 mt-3 w-80 overflow-hidden rounded-card bg-white shadow-2xl ring-1 ring-slate-200/60 dark:bg-zinc-900 dark:ring-white/10"
                  >
                    <div className="border-b border-slate-100 px-5 py-3.5 dark:border-white/5">
                      <p className="text-sm font-semibold dark:text-white">Thông báo</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {NOTIFICATIONS.slice(0, 4).map((n) => (
                        <div
                          key={n.id}
                          className="flex gap-3 border-b border-slate-50 px-5 py-3.5 transition-colors last:border-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                        >
                          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                          <div className={n.read ? 'pl-5' : ''}>
                            <p className="text-[13px] font-medium dark:text-white">{n.title}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{n.content}</p>
                            <p className="mt-1 text-[10px] tracking-wide text-slate-400 uppercase">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link
                      to="/tai-khoan/thong-bao"
                      className="block bg-slate-50 py-3 text-center text-xs font-semibold tracking-widest uppercase transition-colors hover:bg-accent/20 dark:bg-white/5 dark:text-white"
                    >
                      Xem tất cả
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link to="/tai-khoan/yeu-thich" className={`${iconCls} hidden sm:flex`} aria-label="Yêu thích">
              <Heart size={18} />
              {wishlist.ids.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {wishlist.ids.length}
                </span>
              )}
            </Link>
            <button className={iconCls} onClick={() => setDrawerOpen(true)} aria-label="Giỏ hàng">
              <ShoppingBag size={18} />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink"
                >
                  {count}
                </motion.span>
              )}
            </button>
            <Link to={user ? '/tai-khoan' : '/dang-nhap'} className={`${iconCls} hidden sm:flex`} aria-label="Tài khoản">
              {user ? (
                <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover ring-2 ring-accent/50" />
              ) : (
                <User size={18} />
              )}
            </Link>
          </div>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {megaOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full hidden border-t border-slate-100 bg-white/95 shadow-2xl backdrop-blur-2xl lg:block dark:border-white/5 dark:bg-zinc-950/95"
            >
              <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_2fr] gap-12 px-10 py-10">
                <div>
                  <p className="mb-5 text-[11px] font-semibold tracking-[0.25em] text-slate-400 uppercase">Danh mục</p>
                  <div className="grid grid-cols-2 gap-x-8">
                    {CATEGORIES.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.35 }}
                      >
                        <Link
                          to={`/danh-muc?loai=${c.slug}`}
                          className="group flex items-center justify-between border-b border-slate-100 py-3.5 dark:border-white/5"
                        >
                          <span className="text-sm font-medium transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-accent-dark dark:text-white">
                            {c.name}
                          </span>
                          <span className="text-xs text-slate-400">{c.count}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  <Link
                    to="/danh-muc"
                    className="group mt-6 inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-accent-dark uppercase"
                  >
                    Xem toàn bộ <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {CATEGORIES.slice(0, 2).map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                    >
                      <Link to={`/danh-muc?loai=${c.slug}`} className="img-zoom group relative block h-56 overflow-hidden rounded-card">
                        <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                        <div className="absolute bottom-5 left-5">
                          <p className="font-display text-xl font-medium text-white">{c.name}</p>
                          <p className="mt-1 text-xs tracking-widest text-white/70 uppercase">{c.count} sản phẩm</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-ink/60 backdrop-blur-md"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-24 w-[92%] max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-hidden rounded-card bg-white shadow-2xl dark:bg-zinc-900">
                <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/5">
                  <Search size={20} className="text-slate-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && query.trim()) {
                        navigate(`/danh-muc?q=${encodeURIComponent(query)}`)
                        setSearchOpen(false)
                      }
                      if (e.key === 'Escape') setSearchOpen(false)
                    }}
                    placeholder="Tìm kiếm sản phẩm, danh mục..."
                    className="flex-1 bg-transparent text-lg outline-none placeholder:text-slate-400 dark:text-white"
                  />
                  <button onClick={() => setSearchOpen(false)} className="cursor-pointer text-slate-400 hover:text-ink dark:hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                {results.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto p-3">
                    {results.map((p) => (
                      <Link
                        key={p.id}
                        to={`/san-pham/${p.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        <img src={p.images[0]} alt={p.name} className="h-14 w-11 rounded-xl object-cover" />
                        <div className="flex-1">
                          <p className="text-sm font-medium dark:text-white">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.category}</p>
                        </div>
                        <span className="text-sm font-semibold dark:text-white">{formatVND(p.price)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-5">
                    <p className="mb-3 text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">Từ khóa phổ biến</p>
                    <div className="flex flex-wrap gap-2">
                      {['Blazer', 'Đầm lụa', 'Linen', 'Trench coat', 'Minimal'].map((k) => (
                        <button
                          key={k}
                          onClick={() => setQuery(k)}
                          className="cursor-pointer rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium transition-all hover:border-accent hover:bg-accent/10 dark:border-white/10 dark:text-white"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-[85] flex w-[85%] max-w-sm flex-col bg-white shadow-2xl lg:hidden dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-white/5">
                <span className="flex items-center gap-2.5 font-display text-xl font-semibold dark:text-white">
                  <img src="/favicon.png" alt="Logo Hoàng Nha" className="h-8 w-8 rounded-full object-cover" />
                  Hoàng Nha<span className="text-accent">.</span>
                </span>
                <button onClick={() => setMobileOpen(false)} className="cursor-pointer dark:text-white" aria-label="Đóng">
                  <X size={22} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-6 py-6">
                {NAV.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                  >
                    <Link
                      to={item.to}
                      className={`block border-b border-slate-100 py-4 font-display text-2xl font-medium dark:border-white/5 dark:text-white ${item.hot ? 'text-danger' : ''}`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-8 space-y-3">
                  <Link to={user ? '/tai-khoan' : '/dang-nhap'} className="flex items-center gap-3 text-sm font-medium dark:text-white">
                    <User size={17} /> {user ? user.name : 'Đăng nhập / Đăng ký'}
                  </Link>
                  <Link to="/tai-khoan/yeu-thich" className="flex items-center gap-3 text-sm font-medium dark:text-white">
                    <Heart size={17} /> Yêu thích ({wishlist.ids.length})
                  </Link>
                  <Link to="/tai-khoan/thong-bao" className="flex items-center gap-3 text-sm font-medium dark:text-white">
                    <Bell size={17} /> Thông báo
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className="flex items-center gap-3 text-sm font-semibold text-accent-dark">
                      <ShieldCheck size={17} /> Trang quản trị
                    </Link>
                  )}
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
