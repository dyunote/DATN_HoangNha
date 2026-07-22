import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 -left-24 h-80 w-80 rounded-full bg-accent/15 blur-[100px]" />
        <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
      </div>
      <div className="relative text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[9rem] leading-none font-semibold sm:text-[13rem] dark:text-white"
        >
          4<span className="text-gradient-gold italic">0</span>4
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="font-display mt-2 text-2xl font-medium sm:text-3xl dark:text-white"
        >
          Trang bạn tìm không tồn tại
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.7 }}
          className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400"
        >
          Giống như một xu hướng đã lỗi thời — trang này không còn ở đây nữa. Hãy quay lại và khám phá những điều mới mẻ.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="mt-9 flex justify-center gap-3"
        >
          <Link to="/"><Button size="lg">Về trang chủ</Button></Link>
          <Link to="/danh-muc"><Button size="lg" variant="outline">Mua sắm</Button></Link>
        </motion.div>
      </div>
    </div>
  )
}
