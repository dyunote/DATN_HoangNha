import { Link } from "react-router-dom";
import Reveal from "./Reveal";

export interface LookbookProps {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  ctaLabel: string;
  href: string;
  /** When true, image sits on the right (alternating split layout) */
  reverse?: boolean;
}

/**
 * Split brand-story / lookbook block: big image one side, text the other.
 * Nằm trong khung giữa (max-w-7xl) — không tràn ra hai mép màn hình.
 */
export default function Lookbook({
  eyebrow,
  title,
  body,
  image,
  ctaLabel,
  href,
  reverse = false,
}: LookbookProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24">
      <div className="grid md:grid-cols-2 items-stretch gap-8 lg:gap-12">
        {/* Ảnh */}
        <Reveal className={reverse ? "md:order-2" : "md:order-1"}>
          <div className="relative h-full min-h-[48vh] md:min-h-[56vh] bg-beige overflow-hidden">
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </Reveal>

        {/* Nội dung */}
        <Reveal delay={140} className={reverse ? "md:order-1" : "md:order-2"}>
          <div className="flex items-center h-full py-4 md:py-10">
            <div className="max-w-md">
              <p className="text-accent text-[11px] uppercase tracking-[0.35em] mb-5">
                {eyebrow}
              </p>
              <h2
                className="font-display text-ink font-medium leading-[1.05]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
              >
                {title}
              </h2>
              <p className="mt-6 text-ink-soft text-base leading-relaxed font-light">
                {body}
              </p>
              <Link
                to={href}
                className="inline-flex items-center gap-2 mt-8 text-ink text-xs uppercase tracking-[0.25em] border-b border-ink/30 pb-1 hover:border-accent hover:text-accent transition-colors"
              >
                {ctaLabel} <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
