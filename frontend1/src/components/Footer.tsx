import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Khám phá",
    links: [
      { to: "/products?category=ao-khoac", label: "Áo khoác" },
      { to: "/products?category=ao-thun", label: "Áo thun" },
      { to: "/products?category=vay", label: "Váy" },
      { to: "/products?category=dam", label: "Đầm" },
    ],
  },
  {
    title: "Về Hoàng Nha",
    links: [
      { to: "/about", label: "Giới thiệu" },
      { to: "/stores", label: "Hệ thống cửa hàng" },
      { to: "/careers", label: "Cơ hội việc làm" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { to: "/returns", label: "Chính sách đổi hàng" },
      { to: "/size-guide", label: "Hướng dẫn chọn size" },
      { to: "/privacy", label: "Chính sách bảo mật" },
    ],
  },
];

const SOCIAL = [
  { href: "https://facebook.com", label: "Facebook" },
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://tiktok.com", label: "TikTok" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-cream/70 mt-auto font-light">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link
              to="/"
              className="font-display text-2xl font-semibold tracking-[0.15em] uppercase text-cream"
            >
              Hoàng Nha
            </Link>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">
              Thời trang Việt hiện đại — tinh giản, bền vững, dành cho cuộc sống
              thường nhật.
            </p>
            <div className="flex items-center gap-5 mt-6 text-xs uppercase tracking-[0.2em]">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h4 className="text-cream text-xs font-medium tracking-[0.2em] uppercase mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="hover:text-cream transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="md:col-span-2">
            <h4 className="text-cream text-xs font-medium tracking-[0.2em] uppercase mb-4">
              Liên hệ
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="tel:0979026169" className="hover:text-cream transition-colors">
                  0979 026 169
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@hoangnha.com"
                  className="hover:text-cream transition-colors"
                >
                  hello@hoangnha.com
                </a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cream transition-colors">
                  Gửi liên hệ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center sm:text-left text-[11px] tracking-[0.2em] text-cream/40 pt-10 mt-10 border-t border-cream/10 uppercase">
          © 2026 Công ty Hoàng Nha — MST: 0979026169
        </div>
      </div>
    </footer>
  );
}
