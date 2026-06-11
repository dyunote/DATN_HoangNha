import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?search=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-4 items-center h-24">
          <div className="col-span-3 flex items-center justify-start h-full">
            <Link
              to="/"
              className="block w-full max-w-[220px] h-full flex items-center py-2 transition-transform duration-300 hover:scale-[1.02]"
            >
              <img
                src="/public/images/logo.png"
                alt="Hoàng Nha Luxury Logo"
                className="h-20 w-full object-contain object-left"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback =
                    document.getElementById("logo-text-fallback");
                  if (fallback) fallback.style.display = "block";
                }}
              />
              <div id="logo-text-fallback" className="hidden text-left">
                <span className="font-serif text-2xl font-bold tracking-widest text-[#a3704c]">
                  HOÀNG NHA
                </span>
                <span className="block text-[9px] tracking-[0.2em] text-gray-400 uppercase mt-0.5">
                  Premium Concept
                </span>
              </div>
            </Link>
          </div>

          <nav className="col-span-5 flex items-center justify-start space-x-8 font-light tracking-wide text-gray-600 text-[13px] uppercase">
            <Link
              to="/products"
              className="hover:text-[#a3704c] hover:font-normal transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-[#a3704c] hover:after:w-full after:transition-all after:duration-300"
            >
              Thể loại
            </Link>
            <Link
              to="/products?tab=new"
              className="hover:text-[#a3704c] hover:font-normal transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-[#a3704c] hover:after:w-full after:transition-all after:duration-300"
            >
              Hàng mới
            </Link>
            <Link
              to="/products?category=nam"
              className="hover:text-[#a3704c] hover:font-normal transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-[#a3704c] hover:after:w-full after:transition-all after:duration-300"
            >
              Nam
            </Link>
            <Link
              to="/products?category=nu"
              className="hover:text-[#a3704c] hover:font-normal transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-[#a3704c] hover:after:w-full after:transition-all after:duration-300"
            >
              Nữ
            </Link>
            <Link
              to="/products?category=do-ngu"
              className="hover:text-[#a3704c] hover:font-normal transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-[#a3704c] hover:after:w-full after:transition-all after:duration-300"
            >
              Đồ ngủ
            </Link>
          </nav>

          <div className="col-span-4 flex items-center justify-end space-x-6">
            <form
              onSubmit={handleSearch}
              className="flex-1 max-w-[180px] relative flex items-center border-b border-gray-200 py-1 focus-within:border-[#a3704c] transition-colors duration-300"
            >
              <input
                type="text"
                placeholder="TÌM KIẾM"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-transparent pr-6 text-[11px] tracking-wider text-gray-700 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#a3704c] transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z"
                  />
                </svg>
              </button>
            </form>

            <div className="flex items-center space-x-5 text-gray-500 flex-shrink-0">
              <a
                href="tel:0123456789"
                className="hover:text-[#a3704c] transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.2}
                  stroke="currentColor"
                  className="w-[22px] h-[22px]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.514 2.018a14.977 14.977 0 0 1-8.184-8.184l2.018-1.514c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                  />
                </svg>
              </a>

              <div className="relative">
                {user ? (
                  <>
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      className="hover:text-[#a3704c] transition-colors duration-300 flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.2}
                        stroke="currentColor"
                        className="w-[22px] h-[22px]"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                        />
                      </svg>
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 mt-4 w-52 bg-white border border-gray-50 rounded-lg shadow-2xl py-1.5 text-xs text-gray-700 z-50">
                        <div className="px-4 py-2 border-b border-gray-50 font-medium text-gray-400 tracking-wider truncate">
                          XIN CHÀO, {user.full_name.toUpperCase()}
                        </div>
                        <Link
                          to="/account"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 hover:bg-gray-50 hover:text-[#a3704c]"
                        >
                          Tài khoản của tôi
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 hover:bg-gray-50 hover:text-[#a3704c]"
                        >
                          Đơn hàng của tôi
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            to="/admin"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2.5 bg-amber-50/40 text-amber-800 hover:bg-amber-50 font-medium"
                          >
                            Trang quản trị Admin
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setMenuOpen(false);
                            navigate("/");
                          }}
                          className="block w-full text-left px-4 py-2.5 hover:bg-red-50/50 text-red-600 border-t border-gray-50"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="hover:text-[#a3704c] transition-colors duration-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.2}
                      stroke="currentColor"
                      className="w-[22px] h-[22px]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                  </Link>
                )}
              </div>

              <Link
                to="/cart"
                className="hover:text-[#a3704c] transition-colors duration-300 relative"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.2}
                  stroke="currentColor"
                  className="w-[22px] h-[22px]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 1 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.116 60.116 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#a3704c] text-white text-[9px] font-medium rounded-full min-w-[15px] h-[15px] px-0.5 flex items-center justify-center border border-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
