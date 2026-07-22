import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, User, Lock, MapPin, Package, Heart, Ticket, Bell, LogOut, ShieldCheck, ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const MENU = [
  { to: '/tai-khoan', icon: <LayoutDashboard size={17} />, label: 'Tổng quan', end: true },
  { to: '/tai-khoan/thong-tin', icon: <User size={17} />, label: 'Thông tin cá nhân' },
  { to: '/tai-khoan/mat-khau', icon: <Lock size={17} />, label: 'Đổi mật khẩu' },
  { to: '/tai-khoan/dia-chi', icon: <MapPin size={17} />, label: 'Sổ địa chỉ' },
  { to: '/tai-khoan/don-hang', icon: <Package size={17} />, label: 'Đơn hàng' },
  { to: '/tai-khoan/yeu-thich', icon: <Heart size={17} />, label: 'Yêu thích' },
  { to: '/tai-khoan/voucher', icon: <Ticket size={17} />, label: 'Voucher' },
  { to: '/tai-khoan/thong-bao', icon: <Bell size={17} />, label: 'Thông báo' },
]

export default function AccountLayout() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  return (
    <div className="pt-16 lg:pt-20">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-card bg-white p-6 shadow-xl ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10"
            >
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-white/10">
                <div className="relative">
                  <img
                    src={user?.avatar ?? 'https://i.pravatar.cc/160?img=13'}
                    alt={user?.name ?? 'Khách'}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-accent"
                  />
                  <span className="absolute -right-0.5 -bottom-0.5 h-4 w-4 rounded-full border-2 border-white bg-success dark:border-zinc-900" />
                </div>
                <div>
                  <p className="font-semibold dark:text-white">{user?.name ?? 'Khách'}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-accent-dark uppercase">
                    ★ Thành viên Gold
                  </p>
                </div>
              </div>
              <nav className="mt-4 space-y-1">
                {MENU.map((m) => (
                  <NavLink
                    key={m.to}
                    to={m.to}
                    end={m.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-ink text-white shadow-lg dark:bg-white dark:text-ink'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-ink dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                      }`
                    }
                  >
                    {m.icon} {m.label}
                  </NavLink>
                ))}
                {/* Lối vào trang quản trị — chỉ hiện với tài khoản ADMIN */}
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="group flex items-center gap-3 rounded-xl bg-accent/15 px-4 py-3 text-sm font-semibold text-accent-dark transition-colors hover:bg-accent/25"
                  >
                    <ShieldCheck size={17} /> Trang quản trị
                    <ArrowUpRight size={15} className="ml-auto transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                )}
                <button
                  onClick={() => { logout(); toast('Đã đăng xuất', 'info'); navigate('/') }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/5"
                >
                  <LogOut size={17} /> Đăng xuất
                </button>
              </nav>
            </motion.div>
          </aside>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
