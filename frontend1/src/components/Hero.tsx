import { Link } from "react-router-dom";

/**
 * Full-bleed editorial campaign hero.
 * Giant uppercase Playfair headline + short Vietnamese tagline + single CTA.
 */
export default function Hero() {
  return (
    <section className="full-bleed relative min-h-[90vh] flex items-end overflow-hidden bg-beige">
      {/* Campaign image with graceful gradient fallback */}
      <img
        src="/images/banner.png"
        alt="Bộ sưu tập thời trang Hoàng Nha"
        className="absolute inset-0 w-full h-full object-cover object-center animate-hero-pan"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-beige-dark via-beige to-cream -z-10"
        aria-hidden="true"
      />
      {/* Dark overlay for text legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-3xl animate-fade-up">
          <p className="text-cream/80 text-xs sm:text-sm uppercase tracking-[0.4em] mb-5">
            Bộ sưu tập Thu — Đông 2026
          </p>
          <h1
            className="font-display uppercase text-cream font-medium leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
          >
            Thanh lịch
            <br />
            Vượt thời gian
          </h1>
          <p className="mt-6 max-w-md text-cream/85 text-base sm:text-lg font-light leading-relaxed">
            Thời trang Việt hiện đại — đường nét tinh giản, chất liệu chọn lọc,
            tôn vinh vẻ đẹp tự nhiên của bạn.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-3 mt-9 bg-accent hover:bg-accent-dark text-cream text-xs sm:text-sm uppercase tracking-[0.25em] px-9 py-4 transition-colors duration-300"
          >
            Mua ngay
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
