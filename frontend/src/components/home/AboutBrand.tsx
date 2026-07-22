import { motion } from 'framer-motion'
import Reveal from '@/components/ui/Reveal'
import { useCountUp } from '@/hooks/useCountUp'

function Stat({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { ref, value } = useCountUp(target)
  return (
    <div>
      <p className="font-display text-4xl font-semibold lg:text-5xl dark:text-white">
        <span ref={ref}>{value.toLocaleString('vi-VN')}</span>
        <span className="text-accent">{suffix}</span>
      </p>
      <p className="mt-2 text-xs tracking-[0.2em] text-slate-400 uppercase">{label}</p>
    </div>
  )
}

export default function AboutBrand() {
  return (
    <section className="overflow-hidden bg-white py-20 lg:py-32 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
          {/* Images collage */}
          <div className="relative">
            <Reveal direction="scale" duration={1}>
              <div className="img-zoom overflow-hidden rounded-card">
                <img
                  src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1000&q=80"
                  alt="Cửa hàng Hoàng Nha"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </Reveal>
            <motion.div
              initial={{ opacity: 0, x: 40, y: 40 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -right-4 -bottom-10 w-1/2 overflow-hidden rounded-card border-8 border-paper shadow-2xl sm:-right-8 dark:border-zinc-950"
            >
              <img
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=700&q=80"
                alt="Chất liệu cao cấp"
                className="aspect-square w-full object-cover"
              />
            </motion.div>
            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="glass absolute -top-6 -left-2 rounded-2xl px-5 py-3 shadow-xl sm:-left-6"
            >
              <p className="font-display text-2xl font-semibold text-accent-dark">10+</p>
              <p className="text-[10px] tracking-widest text-slate-500 uppercase dark:text-slate-300">Năm kinh nghiệm</p>
            </motion.div>
          </div>

          {/* Content */}
          <div>
            <Reveal direction="right">
              <span className="text-[11px] font-semibold tracking-[0.3em] text-accent-dark uppercase">
                Về Hoàng Nha
              </span>
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <h2 className="font-display mt-4 text-4xl leading-tight font-medium lg:text-5xl dark:text-white">
                Chúng tôi tin vào vẻ đẹp <span className="italic">vượt thời gian</span>
              </h2>
            </Reveal>
            <Reveal direction="right" delay={0.2}>
              <p className="mt-6 text-sm leading-relaxed text-slate-500 lg:text-base dark:text-slate-400">
                Từ năm 2016, Hoàng Nha theo đuổi triết lý "quiet luxury" — sang trọng không cần phô trương. Mỗi thiết
                kế là kết quả của quá trình nghiên cứu chất liệu kỹ lưỡng, phom dáng được tinh chỉnh cho vóc dáng người
                Việt, và cam kết sản xuất có trách nhiệm với môi trường.
              </p>
            </Reveal>
            <Reveal direction="right" delay={0.3}>
              <div className="mt-12 grid grid-cols-3 gap-8 border-t border-slate-100 pt-10 dark:border-white/10">
                <Stat target={120} suffix="K+" label="Khách hàng" />
                <Stat target={98} suffix="%" label="Hài lòng" />
                <Stat target={500} suffix="+" label="Thiết kế" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
