import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(keyword)}`);
    setMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-rose-600 shrink-0">
          Hoàng Nha
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-700">
          <Link to="/products" className="hover:text-rose-600">Tất cả sản phẩm</Link>
          <Link to="/products?tab=new" className="hover:text-rose-600">Mới về</Link>
          <Link to="/products?tab=bestseller" className="hover:text-rose-600">Bán chạy</Link>
          <Link to="/products?tab=featured" className="hover:text-rose-600">Nổi bật</Link>
        </nav>

        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full border border-gray-300 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </form>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/cart" className="relative text-gray-700 hover:text-rose-600">
            <span className="text-xl">🛒</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="text-sm font-medium text-gray-700 hover:text-rose-600"
              >
                {user.full_name} ▾
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg text-sm">
                  <Link to="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50">
                    Tài khoản của tôi
                  </Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50">
                    Đơn hàng của tôi
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50">
                      Trang quản trị
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate('/');
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-rose-600"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-rose-600">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
