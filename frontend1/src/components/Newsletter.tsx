import { useState, type FormEvent } from "react";
import Reveal from "./Reveal";

/**
 * Minimal monochrome newsletter signup band.
 */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim()) setSent(true);
  };

  return (
    <section className="full-bleed bg-ink text-cream py-20 sm:py-28">
      <Reveal className="max-w-2xl mx-auto px-6 text-center">
        <p className="text-accent text-[11px] uppercase tracking-[0.35em] mb-5">
          Bản tin Hoàng Nha
        </p>
        <h2
          className="font-display font-medium leading-tight"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          Nhận thông tin bộ sưu tập mới nhất
        </h2>
        <p className="mt-4 text-cream/70 font-light">
          Đăng ký để nhận ưu đãi riêng tư và cập nhật sớm nhất từ chúng tôi.
        </p>

        {sent ? (
          <p className="mt-9 text-accent text-sm uppercase tracking-[0.2em]">
            Cảm ơn bạn đã đăng ký!
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-9 flex items-center max-w-md mx-auto border-b border-cream/30 focus-within:border-accent transition-colors"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Địa chỉ email
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              className="flex-1 bg-transparent py-3 text-cream placeholder-cream/40 focus:outline-none"
            />
            <button
              type="submit"
              className="text-cream text-xs uppercase tracking-[0.25em] hover:text-accent transition-colors px-2"
            >
              Đăng ký
            </button>
          </form>
        )}
      </Reveal>
    </section>
  );
}
