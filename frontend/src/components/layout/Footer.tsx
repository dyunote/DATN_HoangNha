import { Link } from 'react-router-dom'
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube, FaPinterestP } from 'react-icons/fa6'
import { SiVisa, SiMastercard, SiApplepay } from 'react-icons/si'
import { MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import { SHOP_CONTACT } from '@/lib/shop'

const SHOP_LINKS = [
  { label: 'Hàng mới về', to: '/danh-muc' },
  { label: 'Bán chạy nhất', to: '/danh-muc' },
  { label: 'Thời trang Nữ', to: '/danh-muc?gioi-tinh=nu' },
  { label: 'Thời trang Nam', to: '/danh-muc?gioi-tinh=nam' },
  { label: 'Sale cuối mùa', to: '/danh-muc?sale=1' },
]

// Trước đây 5 mục này là <a href="#"> — bấm vào chỉ nhảy lên đầu trang.
// Giờ trỏ vào trang thật (xem src/pages/support và App.tsx).
const SUPPORT_LINKS = [
  { label: 'Hướng dẫn chọn size', to: '/huong-dan-chon-size' },
  { label: 'Chính sách đổi trả', to: '/chinh-sach-doi-tra' },
  { label: 'Chính sách bảo mật', to: '/chinh-sach-bao-mat' },
  { label: 'Phương thức thanh toán', to: '/phuong-thuc-thanh-toan' },
  { label: 'Câu hỏi thường gặp', to: '/cau-hoi-thuong-gap' },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      {/* Decorative gradient */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-accent/8 blur-[120px]" />

      <div className="mx-auto max-w-[1440px] px-4 pt-20 pb-10 sm:px-6 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <Reveal direction="up">
            <div>
              <Link to="/" className="flex items-center gap-3 font-display text-3xl font-semibold">
                <img src="/favicon.png" alt="Logo Hoàng Nha" className="h-11 w-11 rounded-full object-cover" />
                <span>
                  Hoàng Nha<span className="text-accent">.</span>
                </span>
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">
                Thương hiệu thời trang cao cấp Việt Nam. Tối giản trong thiết kế, tinh tế trong từng chi tiết, bền vững
                với thời gian.
              </p>
              <div className="mt-7 flex gap-3">
                {[FaFacebookF, FaInstagram, FaTiktok, FaYoutube, FaPinterestP].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:bg-accent hover:text-ink hover:shadow-lg hover:shadow-accent/30"
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.1}>
            <div>
              <p className="label-eyebrow mb-6 text-white/40">Mua sắm</p>
              <ul className="space-y-3.5">
                {SHOP_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="group inline-flex items-center gap-1 text-sm text-white/65 transition-colors hover:text-accent"
                    >
                      {l.label}
                      <ArrowUpRight size={13} className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.18}>
            <div>
              <p className="label-eyebrow mb-6 text-white/40">Hỗ trợ</p>
              <ul className="space-y-3.5">
                {SUPPORT_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="group inline-flex items-center gap-1 text-sm text-white/65 transition-colors hover:text-accent"
                    >
                      {l.label}
                      <ArrowUpRight size={13} className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.26}>
            <div>
              <p className="label-eyebrow mb-6 text-white/40">Liên hệ</p>
              <ul className="space-y-4 text-sm text-white/65">
                <li className="flex gap-3">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
                  {SHOP_CONTACT.address}
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={16} className="shrink-0 text-accent" /> {SHOP_CONTACT.hotline}
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={16} className="shrink-0 text-accent" /> {SHOP_CONTACT.email}
                </li>
              </ul>
              {/* Map */}
              <div className="img-zoom mt-6 h-32 overflow-hidden rounded-card border border-white/10">
                <iframe
                  title="Bản đồ cửa hàng"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=106.699%2C10.771%2C106.707%2C10.777&layer=mapnik"
                  className="h-full w-full grayscale invert-[0.9] transition-all duration-500 hover:grayscale-0 hover:invert-0"
                  loading="lazy"
                />
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-white/40">© 2026 Hoàng Nha Fashion. Thiết kế với sự tinh tế tại Việt Nam.</p>
          <div className="flex items-center gap-4 text-2xl text-white/50">
            <SiVisa className="transition-colors hover:text-white" />
            <SiMastercard className="transition-colors hover:text-white" />
            <SiApplepay className="transition-colors hover:text-white" />
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider">VNPAY</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider">MOMO</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
