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
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-60 bg-gray-900 text-gray-200 flex flex-col">
        <div className="px-4 py-4 text-xl font-bold text-white border-b border-gray-800">
          Hoàng Nha Admin
        </div>
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm font-medium ${
                  isActive ? 'bg-rose-600 text-white' : 'hover:bg-gray-800 text-gray-300'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-800 text-sm">
          <p className="mb-2">Xin chào, {user?.full_name}</p>
          <Link to="/" className="block text-rose-400 hover:underline mb-1">
            Về trang khách hàng
          </Link>
          <button onClick={logout} className="text-rose-400 hover:underline">
            Đăng xuất
          </button>
        </div>
      </aside>
      <div className="flex-1 p-6 overflow-x-auto">
        <Outlet />
      </div>
    </div>
  );
}
