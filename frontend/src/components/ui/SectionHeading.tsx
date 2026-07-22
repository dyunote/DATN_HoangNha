import Reveal from './Reveal'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  link,
  linkLabel = 'Xem tất cả',
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  link?: string
  linkLabel?: string
}) {
  return (
    <div
      className={`mb-12 flex flex-col gap-4 md:mb-16 ${
        align === 'center' ? 'items-center text-center' : 'items-start md:flex-row md:items-end md:justify-between'
      }`}
    >
      <div className={align === 'center' ? 'flex flex-col items-center' : ''}>
        {eyebrow && (
          <Reveal direction="up" distance={20}>
            <span className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-accent-dark uppercase">
              <span className="h-px w-8 bg-accent" />
              {eyebrow}
              {align === 'center' && <span className="h-px w-8 bg-accent" />}
            </span>
          </Reveal>
        )}
        <Reveal direction="up" delay={0.08}>
          <h2 className="font-display text-3xl leading-tight font-medium sm:text-4xl lg:text-5xl dark:text-white">
            {title}
          </h2>
        </Reveal>
        {subtitle && (
          <Reveal direction="up" delay={0.16}>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base dark:text-slate-400">
              {subtitle}
            </p>
          </Reveal>
        )}
      </div>
      {link && (
        <Reveal direction="up" delay={0.2}>
          <Link
            to={link}
            className="link-underline group inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-ink dark:text-white"
          >
            {linkLabel}
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </Reveal>
      )}
    </div>
  )
}
