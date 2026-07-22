import { motion } from 'framer-motion'
import { FaInstagram } from 'react-icons/fa6'
import { INSTAGRAM } from '@/data'
import SectionHeading from '@/components/ui/SectionHeading'

export default function InstagramGallery() {
  return (
    <section className="bg-white py-20 lg:py-28 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="Instagram"
          title="@hoangnha.fashion"
          subtitle="Theo dõi chúng tôi để cập nhật phong cách mỗi ngày."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {INSTAGRAM.map((img, i) => (
            <motion.a
              key={i}
              href="#"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className="group relative block overflow-hidden rounded-2xl"
            >
              <img
                src={img}
                alt={`Instagram ${i + 1}`}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/50 opacity-0 backdrop-blur-[2px] transition-all duration-400 group-hover:opacity-100">
                <FaInstagram className="scale-50 text-3xl text-white transition-transform duration-400 group-hover:scale-100" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
