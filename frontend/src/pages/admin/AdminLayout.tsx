import { useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Ticket, Image, Star, BarChart3, Settings,
  Search, Bell, ChevronLeft, Sun, Moon, ArrowUpRight, Menu, X,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'

const MENU = [
  { section: 'Tổng quan', items: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/thong-ke', icon: BarChart3, label: 'Thống kê' },
  ]},
  { section: 'Quản lý', items: [
    { to: '/admin/san-pham', icon: Package, label: 'Sản phẩm' },
    { to: '/admin/danh-muc', icon: FolderTree, label: 'Danh mục' },
    { to: '/admin/don-hang', icon: ShoppingCart, label: 'Đơn hàng' },
    { to: '/admin/khach-hang', icon: Users, label: 'Khách hàng' },
  ]},
  { section: 'Marketing', items: [
    { to: '/admin/voucher', icon: Ticket, label: 'Voucher' },
    { to: '/admin/banner', icon: Image, label: 'Banner' },
    { to: '/admin/danh-gia', icon: Star, label: 'Đánh giá' },
  ]},
  { section: 'Hệ thống', items: [
    { to: '/admin/cai-dat', icon: Settings, label: 'Cài đặt' },
  ]},
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { dark, toggle } = useTheme()
  const { user } = useAuth()
  const location = useLocation()

  const sidebar = (isMobile: boolean) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex h-16 items-center gap-3 border-b border-slate-100 dark:border-white/5 ${collapsed && !isMobile ? 'justify-center px-2' : 'px-5'}`}>
        <img
          src="/favicon.png"
          alt="Logo Hoàng Nha"
          className="h-9 w-9 shrink-0 rounded-xl object-cover"
        />
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold dark:text-white">Hoàng Nha</p>
            <p className="text-[10px] tracking-widest text-slate-400 uppercase">Admin Panel</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {MENU.map((group) => (
          <div key={group.section}>
            {(!collapsed || isMobile) && (
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">{group.section}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((m) => {
                const Icon = m.icon
                return (
                  <NavLink
                    key={m.to}
                    to={m.to}
                    end={m.end}
                    title={m.label}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                        collapsed && !isMobile ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-ink text-white shadow-lg shadow-ink/15 dark:bg-white dark:text-ink'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon size={17} className="shrink-0" />
                    {(!collapsed || isMobile) && m.label}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Back to store */}
      <div className="border-t border-slate-100 p-3 dark:border-white/5">
        <Link
          to="/"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white ${collapsed && !isMobile ? 'justify-center' : ''}`}
        >
          <ArrowUpRight size={17} className="shrink-0" />
          {(!collapsed || isMobile) && 'Về cửa hàng'}
        </Link>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-svh bg-paper dark:bg-[#0c0c0d]">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 250 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-30 hidden shrink-0 border-r border-slate-200/60 bg-white lg:block dark:border-white/5 dark:bg-zinc-950"
      >
        {sidebar(false)}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-20 -right-3 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:text-ink dark:border-white/10 dark:bg-zinc-900 dark:hover:text-white"
          aria-label="Thu gọn"
        >
          <ChevronLeft size={13} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-[85] w-64 bg-white lg:hidden dark:bg-zinc-950"
            >
              <button onClick={() => setMobileOpen(false)} className="absolute top-5 right-4 z-10 cursor-pointer text-slate-400" aria-label="Đóng">
                <X size={18} />
              </button>
              {sidebar(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-xl sm:px-6 dark:border-white/5 dark:bg-zinc-950/80">
          <button className="cursor-pointer text-slate-500 lg:hidden dark:text-slate-300" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Tìm kiếm... (⌘K)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm outline-none transition-all focus:border-accent focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-zinc-900"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Đổi giao diện">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Thông báo">
              <Bell size={17} />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-danger" />
            </button>
            <div className="ml-1 flex items-center gap-3 border-l border-slate-200 pl-3 dark:border-white/10">
              <img src={user?.avatar ?? 'https://i.pravatar.cc/80?img=13'} alt="Admin" className="h-8 w-8 rounded-full object-cover ring-2 ring-accent/40" />
              <div className="hidden md:block">
                <p className="text-xs font-semibold dark:text-white">{user?.name ?? 'Admin'}</p>
                <p className="text-[10px] text-slate-400">Quản trị viên</p>
              </div>
            </div>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 p-4 sm:p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
