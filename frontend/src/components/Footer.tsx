import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-400 mt-auto font-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-16 pb-8 border-b border-gray-900 text-xs tracking-wider">
          <a
            href="tel:0979026169"
            className="flex items-center space-x-2.5 hover:text-white transition-colors"
          >
            <span className="text-gray-500">Hotline:</span>
            <span className="text-white">0979026169</span>
          </a>
          <a
            href="mailto:Hoangnhashop.com"
            className="flex items-center space-x-2.5 hover:text-white transition-colors"
          >
            <span className="text-gray-500">Email:</span>
            <span className="text-white">Hoangnhashop.com</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-12 text-xs">
          <div className="md:col-span-4 space-y-5">
            <h3 className="text-white text-sm font-semibold tracking-widest uppercase leading-snug">
              Đăng ký nhận tin <br /> khuyến mãi
            </h3>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative flex items-center border-b border-gray-800 py-2 max-w-xs"
            >
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="w-full bg-transparent pr-10 text-gray-300 placeholder-gray-600 focus:outline-none"
              />

              <button type="submit" className="absolute right-0 w-5 h-5">
                <img
                  src="/assets/icons/mail-send.png"
                  alt="Send"
                  className="w-full h-full object-contain invert"
                />
              </button>
            </form>

            <div className="flex items-center space-x-4 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 block hover:opacity-80 transition-opacity"
              >
                <img
                  src="/assets/icons/fb.png"
                  alt="Facebook"
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 block hover:opacity-80 transition-opacity"
              >
                <img
                  src="/assets/icons/instagram.png"
                  alt="Instagram"
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 block hover:opacity-80 transition-opacity"
              >
                <img
                  src="/assets/icons/tiktok.png"
                  alt="TikTok"
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                className="w-6 h-6 block hover:opacity-80 transition-opacity"
              >
                <img
                  src="/assets/icons/zalo.png"
                  alt="Zalo"
                  className="w-full h-full object-contain"
                />
              </a>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-white font-semibold tracking-wider uppercase mb-4">
              Khám phá
            </h4>
            <ul className="space-y-2.5 text-gray-400">
              <li>
                <Link
                  to="/products?category=ao-khoac"
                  className="hover:text-white transition-colors"
                >
                  Áo khoác
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=ao-thun"
                  className="hover:text-white transition-colors"
                >
                  Áo thun
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=vay"
                  className="hover:text-white transition-colors"
                >
                  Váy
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=dam"
                  className="hover:text-white transition-colors"
                >
                  Đầm
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Tạp chí thời trang
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 3: VỀ HOANGNHA */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-white font-semibold tracking-wider uppercase mb-4">
              Về HoangNha
            </h4>
            <ul className="space-y-2.5 text-gray-400">
              <li>
                <Link
                  to="/about"
                  className="hover:text-white transition-colors"
                >
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link
                  to="/manufacturing"
                  className="hover:text-white transition-colors"
                >
                  Công nghệ sản xuất
                </Link>
              </li>
              <li>
                <Link
                  to="/stores"
                  className="hover:text-white transition-colors"
                >
                  Hệ thống cửa hàng
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="hover:text-white transition-colors"
                >
                  Cơ hội việc làm
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 4: TÀI KHOẢN */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-white font-semibold tracking-wider uppercase mb-4">
              Tài khoản
            </h4>
            <ul className="space-y-2.5 text-gray-400">
              <li>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors"
                >
                  Đăng nhập/ Đăng ký
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="hover:text-white transition-colors"
                >
                  Lịch sử mua hàng
                </Link>
              </li>
              <li>
                <Link
                  to="/account/addresses"
                  className="hover:text-white transition-colors"
                >
                  Danh sách địa chỉ
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 5: HỖ TRỢ KHÁCH HÀNG */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-white font-semibold tracking-wider uppercase mb-4">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-2.5 text-gray-400 leading-relaxed">
              <li>
                <Link
                  to="/terms"
                  className="hover:text-white transition-colors"
                >
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  to="/returns"
                  className="hover:text-white transition-colors"
                >
                  Chính sách đổi hàng
                </Link>
              </li>
              <li>
                <Link
                  to="/warranty"
                  className="hover:text-white transition-colors"
                >
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link
                  to="/payment-vnpay"
                  className="hover:text-white transition-colors"
                >
                  Thanh toán VNPAY
                </Link>
              </li>
              <li>
                <Link
                  to="/size-guide"
                  className="hover:text-white transition-colors"
                >
                  Hướng dẫn chọn size
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION: COPYRIGHT */}
        <div className="text-center text-[11px] tracking-widest text-gray-600 pt-8 border-t border-gray-900 uppercase">
          CÔNG TY HOÀNG NHA - MST: 0979026169
        </div>
      </div>
    </footer>
  );
}
