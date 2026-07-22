import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import SectionHeading from '@/components/ui/SectionHeading'

export default function Categories() {
  // UC-05: danh mục từ backend, fallback mock
  const CATEGORIES = useCategories()
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <SectionHeading
        eyebrow="Danh mục"
        title="Khám phá theo phong cách"
        subtitle="Mỗi danh mục là một câu chuyện — được tuyển chọn kỹ lưỡng cho tủ đồ hoàn hảo của bạn."
      />
      {/* Asymmetric grid — bố cục phá cách */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2 lg:gap-6">
        {CATEGORIES.map((c, i) => {
          const spans = [
            'md:col-span-2 md:row-span-2', '', '', 'md:row-span-2', '', '',
          ][i]
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={spans}
            >
              <Link
                to={`/danh-muc?loai=${c.slug}`}
                className={`img-zoom group relative block h-full min-h-44 overflow-hidden rounded-card sm:min-h-52 ${
                  spans ? 'md:min-h-full' : ''
                }`}
              >
                <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between p-5 lg:p-7">
                  <div>
                    <p className={`font-display font-medium text-white ${spans.includes('col-span-2') ? 'text-2xl lg:text-4xl' : 'text-lg lg:text-2xl'}`}>
                      {c.name}
                    </p>
                    <p className="mt-1 text-[11px] tracking-[0.2em] text-white/60 uppercase">{c.count} sản phẩm</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition-all duration-500 group-hover:rotate-45 group-hover:opacity-100 group-hover:bg-accent group-hover:text-ink">
                    <ArrowUpRight size={17} />
                  </span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
