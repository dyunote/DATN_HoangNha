import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import SocialLogin from '@/components/auth/SocialLogin'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  remember: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  // Trang đã đưa người dùng tới đây (do bấm mua hàng khi chưa đăng nhập)
  const from = (location.state as { from?: string } | null)?.from
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      toast('Chào mừng bạn trở lại! ✨')
      // Quay lại đúng trang sản phẩm đang xem, nếu không có thì vào tài khoản
      navigate(from ?? '/tai-khoan', { replace: true })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Đăng nhập thất bại', 'error')
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-medium dark:text-white">Chào mừng trở lại</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Đăng nhập để tiếp tục hành trình phong cách của bạn.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <FormField label="Email" type="email" placeholder="ban@email.com" icon={<Mail size={16} />} error={errors.email?.message} {...register('email')} />
        <FormField label="Mật khẩu" type="password" placeholder="••••••••" icon={<Lock size={16} />} error={errors.password?.message} {...register('password')} />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <input type="checkbox" className="h-4 w-4 cursor-pointer rounded accent-[#111]" {...register('remember')} />
            Ghi nhớ đăng nhập
          </label>
          <Link to="/quen-mat-khau" className="link-underline text-sm font-medium text-accent-dark">
            Quên mật khẩu?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      <SocialLogin />

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Chưa có tài khoản?{' '}
        <Link to="/dang-ky" className="link-underline font-semibold text-ink dark:text-white">
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  )
}
