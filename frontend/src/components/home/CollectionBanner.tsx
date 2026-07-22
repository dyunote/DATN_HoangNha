import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Reveal from '@/components/ui/Reveal'
import MagneticButton from '@/components/ui/MagneticButton'

export default function CollectionBanner() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <section ref={ref} className="bg-white py-20 lg:py-28 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Split layout */}
        <div className="grid overflow-hidden rounded-card bg-[#EFE9DF] lg:grid-cols-2 dark:bg-zinc-900">
          <div className="relative order-2 h-80 overflow-hidden sm:h-[28rem] lg:order-1 lg:h-auto lg:min-h-[34rem]">
            <motion.img
              style={{ y }}
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=80"
              alt="Bộ sưu tập Atelier"
              className="absolute inset-0 h-[116%] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#EFE9DF]/30 dark:to-zinc-900/40" />
          </div>
          <div className="order-1 flex flex-col justify-center px-8 py-14 lg:order-2 lg:px-16 lg:py-20">
            <Reveal direction="right">
              <span className="text-[11px] font-semibold tracking-[0.3em] text-accent-dark uppercase">
                Bộ sưu tập đặc biệt
              </span>
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <h2 className="font-display mt-4 text-4xl leading-tight font-medium lg:text-6xl dark:text-white">
                The Atelier
                <br />
                <span className="italic">Edition</span>
              </h2>
            </Reveal>
            <Reveal direction="right" delay={0.2}>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-600 lg:text-base dark:text-slate-400">
                Giới hạn chỉ 200 thiết kế mỗi mẫu. Được chế tác thủ công từ chất liệu wool Ý và lụa tơ tằm Bảo Lộc,
                Atelier Edition là tuyên ngôn của sự sang trọng thầm lặng.
              </p>
            </Reveal>
            <Reveal direction="right" delay={0.3}>
              <div className="mt-10">
                <MagneticButton>
                  <Link
                    to="/danh-muc"
                    className="inline-flex items-center gap-2 rounded-btn bg-ink px-9 py-4 text-sm font-semibold tracking-widest text-white uppercase transition-all duration-300 hover:shadow-2xl hover:shadow-ink/25 dark:bg-white dark:text-ink"
                  >
                    Khám phá bộ sưu tập
                  </Link>
                </MagneticButton>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
