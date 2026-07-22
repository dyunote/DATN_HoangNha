import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import { useToast } from '@/context/ToastContext'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const { toast } = useToast()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast('Vui lòng nhập email hợp lệ', 'warning')
      return
    }
    toast('Cảm ơn bạn đã đăng ký nhận tin! 🎉')
    setEmail('')
  }

  return (
    <section className="relative overflow-hidden bg-ink py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[30rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[130px]" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full border border-white/5"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full border border-accent/10"
        />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <Reveal direction="blur">
          <span className="text-[11px] font-semibold tracking-[0.35em] text-accent uppercase">Newsletter</span>
        </Reveal>
        <Reveal direction="up" delay={0.1}>
          <h2 className="font-display mt-5 text-4xl leading-tight font-medium text-white lg:text-5xl">
            Trở thành người đầu tiên <span className="italic">khám phá</span>
          </h2>
        </Reveal>
        <Reveal direction="up" delay={0.2}>
          <p className="mt-5 text-sm leading-relaxed text-white/55 lg:text-base">
            Đăng ký để nhận thông tin về bộ sưu tập mới, ưu đãi độc quyền và lời mời tham dự các sự kiện riêng tư — kèm
            voucher 15% cho đơn hàng đầu tiên.
          </p>
        </Reveal>
        <Reveal direction="up" delay={0.3}>
          <form onSubmit={submit} className="gradient-border mx-auto mt-10 flex max-w-md items-center gap-2 rounded-full bg-white/5 p-2 backdrop-blur">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Địa chỉ email của bạn"
              className="flex-1 bg-transparent px-5 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-ink transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-lg hover:shadow-accent/40"
              aria-label="Đăng ký"
            >
              <Send size={16} />
            </button>
          </form>
        </Reveal>
        <Reveal direction="up" delay={0.4}>
          <p className="mt-5 text-[11px] tracking-wide text-white/35">
            Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
