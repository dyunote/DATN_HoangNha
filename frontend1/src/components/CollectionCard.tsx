import { Link } from "react-router-dom";

export interface CollectionCardProps {
  title: string;
  subtitle: string;
  image: string;
  href: string;
  /** Extra classes for asymmetric sizing in the parent grid */
  className?: string;
}

/**
 * Editorial collection card — tall image, hover zoom, overlaid name + Discover link.
 */
export default function CollectionCard({
  title,
  subtitle,
  image,
  href,
  className = "",
}: CollectionCardProps) {
  return (
    <Link
      to={href}
      className={`group relative block overflow-hidden bg-beige ${className}`}
      aria-label={`Khám phá bộ sưu tập ${title}`}
    >
      <img
        src={image}
        alt={`Bộ sưu tập ${title}`}
        className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/10 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 p-7 sm:p-9">
        <p className="text-cream/75 text-[10px] uppercase tracking-[0.3em] mb-2">
          {subtitle}
        </p>
        <h3 className="font-display text-cream text-3xl sm:text-4xl font-medium leading-none">
          {title}
        </h3>
        <span className="inline-flex items-center gap-2 mt-4 text-cream text-xs uppercase tracking-[0.25em] border-b border-cream/40 pb-1 transition-colors group-hover:border-accent group-hover:text-accent">
          Khám phá <span aria-hidden="true">&rarr;</span>
        </span>
      </div>
    </Link>
  );
}
