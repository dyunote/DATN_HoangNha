import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const NAV_LINKS = [
  { to: "/products", label: "Sản phẩm" },
  { to: "/products?tab=featured", label: "Nổi bật" },
  { to: "/products?tab=new", label: "Mới về" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === "/";
  // Transparent only over the hero on the homepage, before scrolling
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?search=${encodeURIComponent(keyword.trim())}`);
    }
  };

  const textColor = transparent ? "text-cream" : "text-ink";

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        transparent
          ? "bg-gradient-to-b from-ink/60 via-ink/25 to-transparent"
          : "bg-cream/95 backdrop-blur-md border-b border-beige"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className={`font-display text-xl sm:text-2xl font-semibold tracking-[0.15em] uppercase transition-colors ${textColor} hover:text-accent`}
          >
            Hoàng Nha
          </Link>

          {/* Center nav */}
          <nav
            className={`hidden md:flex items-center gap-10 text-[12px] uppercase tracking-[0.2em] transition-colors ${textColor}`}
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="relative hover:text-accent transition-colors after:absolute after:bottom-[-5px] after:left-0 after:h-px after:w-0 after:bg-accent hover:after:w-full after:transition-all after:duration-300"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className={`flex items-center gap-5 ${textColor}`}>
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex items-center border-b border-current/30 focus-within:border-accent transition-colors"
            >
              <label htmlFor="header-search" className="sr-only">
                Tìm kiếm sản phẩm
              </label>
              <input
                id="header-search"
                type="text"
                placeholder="TÌM KIẾM"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-28 bg-transparent py-1 text-[11px] tracking-wider placeholder-current/50 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="hover:text-accent transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.3}
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

            {/* Account */}
            <div className="relative">
              {user ? (
                <>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="Tài khoản"
                    aria-expanded={menuOpen}
                    className="hover:text-accent transition-colors flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.3}
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
                    <div className="absolute right-0 mt-4 w-52 bg-cream border border-beige shadow-2xl py-1.5 text-xs text-ink z-50">
                      <div className="px-4 py-2 border-b border-beige font-medium text-ink-soft tracking-wider truncate">
                        XIN CHÀO, {user.full_name.toUpperCase()}
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 hover:bg-beige/50 hover:text-accent"
                      >
                        Tài khoản của tôi
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 bg-accent/10 text-accent-dark hover:bg-accent/20 font-medium"
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
                        className="block w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 border-t border-beige"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  aria-label="Đăng nhập"
                  className="hover:text-accent transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.3}
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

            {/* Cart */}
            <Link
              to="/cart"
              aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
              className="hover:text-accent transition-colors relative"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.3}
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
                <span className="absolute -top-1 -right-1 bg-accent text-cream text-[9px] font-medium rounded-full min-w-[15px] h-[15px] px-0.5 flex items-center justify-center border border-cream">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
