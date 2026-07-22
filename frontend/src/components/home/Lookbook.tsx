import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { LOOKBOOK } from '@/data'
import SectionHeading from '@/components/ui/SectionHeading'

export default function Lookbook() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <SectionHeading
        eyebrow="Lookbook"
        title="Featured Collection"
        subtitle="Phong cách tạp chí — nơi thời trang gặp gỡ nghệ thuật thị giác."
      />
      {/* Magazine layout: staggered heights */}
      <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
        {LOOKBOOK.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={i === 1 ? 'md:mt-16' : ''}
          >
            <Link to="/danh-muc" className="img-zoom group relative block overflow-hidden rounded-card">
              <div className={i === 1 ? 'aspect-[3/4.3]' : 'aspect-[3/4]'}>
                <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
              {/* Number - magazine style */}
              <span className="font-display absolute top-6 left-6 text-6xl font-medium text-white/25 italic">
                0{i + 1}
              </span>
              <div className="absolute right-6 bottom-6 left-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.3em] text-accent uppercase">{item.season}</p>
                  <p className="font-display mt-2 text-2xl font-medium text-white lg:text-3xl">{item.title}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur transition-all duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
