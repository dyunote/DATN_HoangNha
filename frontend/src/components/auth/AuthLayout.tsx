import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout({
  children,
  image = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=80',
  quote = 'Thời trang phai nhạt, chỉ phong cách là vĩnh cửu.',
  author = '— Yves Saint Laurent',
}: {
  children: ReactNode
  image?: string
  quote?: string
  author?: string
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Image side */}
      <div className="relative hidden overflow-hidden lg:block">
        <motion.img
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          src={image}
          alt="Hoàng Nha Fashion"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/30" />
        <Link to="/" className="font-display absolute top-10 left-10 flex items-center gap-2.5 text-2xl font-semibold text-white">
          <img src="/favicon.png" alt="Logo Hoàng Nha" className="h-10 w-10 rounded-full object-cover" />
          <span>
            Hoàng Nha<span className="text-accent">.</span>
          </span>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute bottom-14 left-10 max-w-md"
        >
          <p className="font-display text-3xl leading-snug text-white italic">“{quote}”</p>
          <p className="mt-4 text-sm tracking-[0.2em] text-white/60 uppercase">{author}</p>
        </motion.div>
        {/* Floating shapes */}
        <div className="animate-float absolute top-[25%] right-[15%] h-28 w-28 rounded-full border border-white/20" />
        <div className="animate-float-slow absolute right-[10%] bottom-[30%] h-16 w-16 rounded-full bg-accent/30 blur-lg" />
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center overflow-hidden px-5 py-16 sm:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/10 blur-[90px]" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-[90px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="glass relative w-full max-w-md rounded-card p-8 shadow-2xl sm:p-10"
        >
          <Link to="/" className="font-display mb-2 flex items-center gap-2 text-xl font-semibold lg:hidden dark:text-white">
            <img src="/favicon.png" alt="Logo Hoàng Nha" className="h-8 w-8 rounded-full object-cover" />
            <span>
              Hoàng Nha<span className="text-accent">.</span>
            </span>
          </Link>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
