import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import gsap from 'gsap'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { HERO_SLIDES } from '@/data'
import MagneticButton from '@/components/ui/MagneticButton'
import 'swiper/css'
import 'swiper/css/effect-fade'

export default function Hero() {
  const [active, setActive] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-hero-eyebrow]',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' },
      )
      gsap.fromTo(
        '[data-hero-word]',
        { y: 90, opacity: 0, rotateX: 40 },
        { y: 0, opacity: 1, rotateX: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out', delay: 0.15 },
      )
      gsap.fromTo(
        '[data-hero-sub]',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.55 },
      )
      gsap.fromTo(
        '[data-hero-cta]',
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.75 },
      )
    }, el)
    return () => ctx.revert()
  }, [active])

  const slide = HERO_SLIDES[active]

  return (
    <section className="relative h-svh min-h-[600px] w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        loop
        speed={1400}
        onSlideChange={(s) => setActive(s.realIndex)}
        className="absolute inset-0 h-full w-full"
      >
        {HERO_SLIDES.map((s, i) => (
          <SwiperSlide key={s.id}>
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={s.image}
                alt={s.title}
                className={`h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${
                  active === i ? 'scale-110' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/35 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-ink/20" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Floating decorative shapes */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="animate-float absolute top-[18%] right-[12%] hidden h-36 w-36 rounded-full border border-white/15 lg:block" />
        <div className="animate-float-slow absolute right-[8%] bottom-[22%] hidden h-20 w-20 rounded-full bg-accent/25 blur-xl lg:block" />
        <div className="absolute top-[30%] right-[20%] hidden h-64 w-64 rounded-full bg-accent/10 blur-[90px] lg:block" />
      </div>

      {/* Content */}
      <div ref={contentRef} className="absolute inset-0 z-20 flex items-center">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-10">
          <div className="max-w-3xl" style={{ perspective: '800px' }}>
            <p
              data-hero-eyebrow
              className="mb-6 inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.35em] text-accent uppercase sm:text-xs"
            >
              <span className="h-px w-12 bg-accent" />
              {slide.eyebrow}
            </p>
            <h1 className="font-display text-5xl leading-[1.05] font-medium text-white sm:text-6xl lg:text-8xl">
              {slide.title.split(' ').map((word, i) => (
                <span key={`${active}-${i}`} className="inline-block overflow-hidden pb-2 align-top">
                  <span data-hero-word className="inline-block">
                    {word}&nbsp;
                  </span>
                </span>
              ))}
            </h1>
            <p data-hero-sub className="mt-6 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
              {slide.subtitle}
            </p>
            <div data-hero-cta className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticButton>
                <Link
                  to="/danh-muc"
                  className="group inline-flex items-center gap-3 rounded-btn bg-white px-9 py-4 text-sm font-semibold tracking-widest text-ink uppercase shadow-2xl transition-all duration-300 hover:bg-accent hover:shadow-accent/40"
                >
                  {slide.cta}
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  to="/danh-muc"
                  className="glass-dark inline-flex items-center gap-2 rounded-btn px-8 py-4 text-sm font-semibold tracking-widest text-white uppercase transition-all duration-300 hover:bg-white/20"
                >
                  Lookbook 2026
                </Link>
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-6 z-20 flex items-center gap-4 lg:left-10">
        {HERO_SLIDES.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${active === i ? 'text-white' : 'text-white/40'}`}>
              0{i + 1}
            </span>
            <span className="relative h-px w-10 overflow-hidden bg-white/25">
              {active === i && (
                <motion.span
                  layoutId="hero-progress"
                  className="absolute inset-y-0 left-0 w-full bg-accent"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 6, ease: 'linear' }}
                />
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 sm:flex"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase">Cuộn xuống</span>
        <ChevronDown size={16} />
      </motion.div>

      {/* Vertical side text */}
      <div className="writing-vertical absolute top-1/2 right-6 z-20 hidden -translate-y-1/2 text-[10px] tracking-[0.5em] text-white/40 uppercase lg:block">
        Hoàng Nha Fashion — Est. 2016
      </div>
    </section>
  )
}
