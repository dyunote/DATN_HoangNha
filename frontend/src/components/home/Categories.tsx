import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import SectionHeading from '@/components/ui/SectionHeading'

/**
 * Bố cục phá cách: ô đầu to 2×2, ô thứ tư cao 2 hàng, còn lại 1×1.
 * Mẫu này thiết kế cho 6 danh mục (lưới 4 cột × 2 hàng) nên phải lặp lại
 * theo nhóm 6 — LỖI CŨ: đọc thẳng spans[i], admin thêm danh mục thứ 7 là
 * spans[6] = undefined rồi `spans.includes(...)` làm sập cả trang chủ.
 */
const SPANS = ['md:col-span-2 md:row-span-2', '', '', 'md:row-span-2', '', '']

export default function Categories() {
  // UC-05: danh mục lấy từ database
  const { categories: CATEGORIES } = useCategories()
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
          const spans = SPANS[i % SPANS.length] ?? ''
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
                {/* Ảnh được phép rỗng (admin chưa tải ảnh) → nền chữ cái đầu,
                    không để thẻ <img src=""> hiện icon ảnh vỡ trên trang chủ */}
                {c.image ? (
                  <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-300 dark:bg-zinc-700">
                    <span className="font-display text-6xl font-medium text-white/70">{c.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
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
