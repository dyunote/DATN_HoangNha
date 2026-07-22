import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import { Quote } from 'lucide-react'
import { REVIEWS } from '@/data'
import Rating from '@/components/ui/Rating'
import SectionHeading from '@/components/ui/SectionHeading'
import 'swiper/css'
import 'swiper/css/pagination'

export default function ReviewsSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Soft background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 -left-24 h-80 w-80 rounded-full bg-accent/15 blur-[100px]" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="Đánh giá"
          title="Khách hàng nói gì về chúng tôi"
          subtitle="Hơn 12.000 đánh giá 5 sao — niềm tin được xây dựng từ chất lượng thật."
        />
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4200, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop
          speed={800}
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="!pb-14"
        >
          {REVIEWS.map((r) => (
            <SwiperSlide key={r.id} className="h-auto!">
              <div className="glass group flex h-full flex-col rounded-card p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <Quote size={28} className="text-accent transition-transform duration-500 group-hover:scale-110" />
                <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-600 italic dark:text-slate-300">
                  “{r.content}”
                </p>
                <div className="mt-7 flex items-center gap-4 border-t border-slate-200/60 pt-6 dark:border-white/10">
                  <img src={r.avatar} alt={r.author} className="h-11 w-11 rounded-full object-cover ring-2 ring-accent/40" />
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{r.author}</p>
                    <Rating value={r.rating} size={12} />
                  </div>
                  <span className="ml-auto text-[10px] tracking-wider text-slate-400 uppercase">{r.date}</span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
