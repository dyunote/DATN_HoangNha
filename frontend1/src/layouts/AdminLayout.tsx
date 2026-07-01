import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/products', label: 'Sản phẩm' },
  { to: '/admin/categories', label: 'Danh mục' },
  { to: '/admin/orders', label: 'Đơn hàng' },
  { to: '/admin/vouchers', label: 'Voucher' },
  { to: '/admin/users', label: 'Người dùng' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-cream">
      <aside className="w-60 bg-ink text-cream/70 flex flex-col">
        <div className="px-5 py-5 border-b border-cream/10">
          <Link to="/" className="font-display text-lg font-semibold tracking-[0.15em] uppercase text-cream">
            Hoàng Nha
          </Link>
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent mt-1">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-3 py-2.5 text-xs uppercase tracking-[0.12em] transition-colors ${
                  isActive ? 'bg-accent text-cream' : 'text-cream/60 hover:text-cream hover:bg-cream/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-cream/10 text-sm">
          <p className="mb-2 text-cream/80">Xin chào, {user?.full_name}</p>
          <Link to="/" className="block text-accent hover:text-cream transition-colors mb-1 text-xs uppercase tracking-wider">
            Về trang khách hàng
          </Link>
          <button onClick={logout} className="text-accent hover:text-cream transition-colors text-xs uppercase tracking-wider">
            Đăng xuất
          </button>
        </div>
      </aside>
      <div className="flex-1 p-6 lg:p-8 overflow-x-auto">
        <Outlet />
      </div>
    </div>
  );
}
