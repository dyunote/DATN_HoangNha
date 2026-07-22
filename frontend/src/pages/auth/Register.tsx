import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import SocialLogin from '@/components/auth/SocialLogin'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const schema = z
  .object({
    name: z.string().min(2, 'Vui lòng nhập họ tên'),
    phone: z.string().regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirm: z.string(),
    terms: z.literal(true, { message: 'Bạn cần đồng ý điều khoản' }),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Mật khẩu nhập lại không khớp' })

type FormData = z.infer<typeof schema>

function strengthOf(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const STRENGTH_META = [
  { label: 'Quá yếu', color: 'bg-danger' },
  { label: 'Yếu', color: 'bg-danger' },
  { label: 'Trung bình', color: 'bg-warning' },
  { label: 'Mạnh', color: 'bg-success' },
  { label: 'Rất mạnh', color: 'bg-success' },
]

export default function Register() {
  const [step, setStep] = useState(0)
  const { register: registerUser } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  })

  const pw = watch('password') ?? ''
  const strength = strengthOf(pw)

  const next = async () => {
    const ok = await trigger(['name', 'phone', 'email'])
    if (ok) setStep(1)
  }

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({ name: data.name, email: data.email, phone: data.phone, password: data.password })
      toast('Tài khoản đã được tạo. Chào mừng bạn! 🎉')
      navigate('/tai-khoan')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Đăng ký thất bại', 'error')
    }
  }

  return (
    <AuthLayout
      image="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80"
      quote="Ăn mặc đẹp là một hình thức của phép lịch sự."
      author="— Tom Ford"
    >
      <h1 className="font-display text-3xl font-medium dark:text-white">Tạo tài khoản</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Gia nhập cộng đồng Hoàng Nha — nhận ngay voucher 15%.
      </p>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-3">
        {[0, 1].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                step >= s ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'bg-slate-100 text-slate-400 dark:bg-white/10'
              }`}
            >
              {s + 1}
            </span>
            <span className={`text-xs font-medium ${step >= s ? 'text-ink dark:text-white' : 'text-slate-400'}`}>
              {s === 0 ? 'Thông tin' : 'Bảo mật'}
            </span>
            {s === 0 && <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              <FormField label="Họ và tên" placeholder="Nguyễn Văn A" icon={<User size={16} />} error={errors.name?.message} {...register('name')} />
              <FormField label="Số điện thoại" placeholder="0901 234 567" icon={<Phone size={16} />} error={errors.phone?.message} {...register('phone')} />
              <FormField label="Email" type="email" placeholder="ban@email.com" icon={<Mail size={16} />} error={errors.email?.message} {...register('email')} />
              <Button type="button" size="lg" className="w-full" onClick={next}>
                Tiếp tục
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              <FormField label="Mật khẩu" type="password" placeholder="Tối thiểu 8 ký tự" icon={<Lock size={16} />} error={errors.password?.message} {...register('password')} />
              {pw && (
                <div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.span
                        key={i}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className={`h-1 flex-1 origin-left rounded-full transition-colors duration-300 ${
                          i < strength ? STRENGTH_META[strength].color : 'bg-slate-200 dark:bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Độ mạnh: <b className="text-ink dark:text-white">{STRENGTH_META[strength].label}</b>
                  </p>
                </div>
              )}
              <FormField label="Nhập lại mật khẩu" type="password" placeholder="••••••••" icon={<Lock size={16} />} error={errors.confirm?.message} {...register('confirm')} />
              <div>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-500 dark:text-slate-400">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-[#111]" {...register('terms')} />
                  <span>
                    Tôi đồng ý với <a href="#" className="font-medium text-accent-dark underline">Điều khoản dịch vụ</a> và{' '}
                    <a href="#" className="font-medium text-accent-dark underline">Chính sách bảo mật</a>
                  </span>
                </label>
                {errors.terms && <p className="mt-1.5 text-xs font-medium text-danger">{errors.terms.message}</p>}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft size={15} />
                </Button>
                <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <SocialLogin />

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Đã có tài khoản?{' '}
        <Link to="/dang-nhap" className="link-underline font-semibold text-ink dark:text-white">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}
