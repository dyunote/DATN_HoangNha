import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react'
import type { Product } from '@/types'
import { useProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/product/ProductCard'
import Reveal from '@/components/ui/Reveal'
import 'swiper/css'

export default function Trending({ onQuickView }: { onQuickView: (p: Product) => void }) {
  const swiperRef = useRef<SwiperType | null>(null)
  const { products } = useProducts()
  const items = products.filter((p) => p.isTrending)

  const navBtn =
    'flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-ink transition-all duration-300 hover:border-ink hover:bg-ink hover:text-white dark:border-white/15 dark:text-white dark:hover:bg-white dark:hover:text-ink'

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal direction="up" distance={20}>
            <span className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-accent-dark uppercase">
              <TrendingUp size={14} /> Đang thịnh hành
            </span>
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 className="font-display text-3xl font-medium sm:text-4xl lg:text-5xl dark:text-white">
              Trending tuần này
            </h2>
          </Reveal>
        </div>
        <Reveal direction="up" delay={0.15}>
          <div className="flex gap-3">
            <button className={navBtn} onClick={() => swiperRef.current?.slidePrev()} aria-label="Trước">
              <ArrowLeft size={17} />
            </button>
            <button className={navBtn} onClick={() => swiperRef.current?.slideNext()} aria-label="Sau">
              <ArrowRight size={17} />
            </button>
          </div>
        </Reveal>
      </div>

      <Swiper
        modules={[Autoplay]}
        onSwiper={(s) => (swiperRef.current = s)}
        autoplay={{ delay: 3800, disableOnInteraction: false }}
        loop
        speed={800}
        spaceBetween={20}
        slidesPerView={1.4}
        breakpoints={{
          480: { slidesPerView: 2, spaceBetween: 20 },
          768: { slidesPerView: 3, spaceBetween: 24 },
          1280: { slidesPerView: 4, spaceBetween: 32 },
        }}
        className="!overflow-visible"
      >
        {items.map((p, i) => (
          <SwiperSlide key={p.id}>
            <ProductCard product={p} index={i} onQuickView={onQuickView} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
