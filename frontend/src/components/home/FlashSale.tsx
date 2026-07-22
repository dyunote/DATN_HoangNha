import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { formatVND } from '@/data'
import { useProducts } from '@/hooks/useProducts'
import { useCountdown } from '@/hooks/useCountdown'
import Reveal from '@/components/ui/Reveal'

const TARGET = Date.now() + 2 * 86400000 + 7 * 3600000 + 33 * 60000

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="glass-dark relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl sm:h-20 sm:w-20">
        <motion.span
          key={value}
          initial={{ y: -26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="font-display text-2xl font-semibold text-white tabular-nums sm:text-3xl"
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </div>
      <span className="mt-2 text-[10px] tracking-[0.25em] text-white/50 uppercase">{label}</span>
    </div>
  )
}

export default function FlashSale() {
  const { days, hours, minutes, seconds } = useCountdown(TARGET)
  const { products } = useProducts()
  const items = products.filter((p) => p.flashSale).slice(0, 4)

  return (
    <section className="relative overflow-hidden bg-ink py-20 lg:py-28">
      {/* Background shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/15 blur-[110px]" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-danger/10 blur-[100px]" />
        <div className="animate-float absolute top-16 right-[15%] hidden h-24 w-24 rounded-full border border-white/10 lg:block" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <Reveal direction="left">
              <span className="inline-flex items-center gap-2 rounded-full bg-danger/15 px-4 py-2 text-[11px] font-bold tracking-[0.25em] text-danger uppercase">
                <Zap size={14} className="animate-pulse-soft fill-danger" /> Flash Sale
              </span>
            </Reveal>
            <Reveal direction="left" delay={0.1}>
              <h2 className="font-display mt-5 text-4xl leading-tight font-medium text-white lg:text-6xl">
                Ưu đãi <span className="text-gradient-gold italic">chớp nhoáng</span>
              </h2>
            </Reveal>
            <Reveal direction="left" delay={0.18}>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
                Giảm đến 50% cho các thiết kế được yêu thích nhất. Số lượng có hạn — khi đồng hồ dừng, ưu đãi kết thúc.
              </p>
            </Reveal>
            <Reveal direction="left" delay={0.26}>
              <div className="mt-8 flex gap-3 sm:gap-4">
                <TimeBox value={days} label="Ngày" />
                <TimeBox value={hours} label="Giờ" />
                <TimeBox value={minutes} label="Phút" />
                <TimeBox value={seconds} label="Giây" />
              </div>
            </Reveal>
            <Reveal direction="left" delay={0.34}>
              <Link
                to="/danh-muc?sale=1"
                className="mt-10 inline-flex items-center gap-2 rounded-btn bg-accent px-9 py-4 text-sm font-semibold tracking-widest text-ink uppercase shadow-2xl shadow-accent/25 transition-all duration-300 hover:bg-white hover:shadow-white/20"
              >
                Săn deal ngay
              </Link>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {items.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 50, rotate: i % 2 ? 1.5 : -1.5 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={`/san-pham/${p.id}`}
                  className="img-zoom group relative block overflow-hidden rounded-card"
                >
                  <div className="aspect-[4/5]">
                    <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 rounded-full bg-danger px-3 py-1 text-[10px] font-bold text-white">
                    -{Math.round((1 - p.price / (p.oldPrice ?? p.price)) * 100)}%
                  </span>
                  <div className="absolute right-4 bottom-4 left-4">
                    <p className="line-clamp-1 text-sm font-medium text-white">{p.name}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-semibold text-accent">{formatVND(p.price)}</span>
                      {p.oldPrice && <span className="text-xs text-white/50 line-through">{formatVND(p.oldPrice)}</span>}
                    </div>
                    {/* Stock bar */}
                    <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/20">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(92, (p.sold / (p.sold + p.stock)) * 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.4 }}
                        className="h-full rounded-full bg-gradient-to-r from-accent to-danger"
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] tracking-wide text-white/60 uppercase">Đã bán {p.sold}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
