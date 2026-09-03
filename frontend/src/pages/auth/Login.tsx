import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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
import { usePageTitle } from '@/hooks/usePageTitle'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  remember: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

/**
 * Mã lỗi backend gắn vào `/dang-nhap?error=...` khi luồng OAuth hỏng. Backend
 * chỉ trả mã, câu chữ tiếng Việt để hết ở đây — sửa lời thoại không phải đụng
 * vào server, và mã ngắn thì không lộ chi tiết nội bộ ra thanh địa chỉ.
 */
const OAUTH_ERRORS: Record<string, string> = {
  access_denied: 'Bạn đã huỷ cấp quyền nên chưa đăng nhập được.',
  // Ca rất hay gặp: tài khoản Facebook đăng ký bằng số điện thoại, hoặc người
  // dùng bỏ tick quyền email ở màn hình đồng ý.
  no_email: 'Tài khoản mạng xã hội này không chia sẻ email nên chưa tạo được tài khoản. Bạn hãy đăng ký bằng email và mật khẩu nhé.',
  email_unverified: 'Email của tài khoản Google này chưa được xác thực. Hãy xác thực email rồi thử lại.',
  invalid_state: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng bấm lại nút đăng nhập.',
  oauth_failed: 'Không kết nối được với nhà cung cấp đăng nhập. Vui lòng thử lại sau.',
}

export default function Login() {
  usePageTitle('Đăng nhập')
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  // Trang đã đưa người dùng tới đây (do bấm mua hàng khi chưa đăng nhập)
  const from = (location.state as { from?: string } | null)?.from
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Luồng OAuth thất bại thì backend redirect về đây kèm ?error=<mã>.
  const [searchParams, setSearchParams] = useSearchParams()
  // StrictMode chạy effect hai lần khi dev → chốt lại kẻo toast hiện hai cái.
  const shownError = useRef(false)
  useEffect(() => {
    const code = searchParams.get('error')
    if (!code || shownError.current) return
    shownError.current = true
    toast(OAUTH_ERRORS[code] ?? 'Đăng nhập bằng mạng xã hội thất bại.', 'error')
    // Dọn query để F5 không hiện lại thông báo cũ, và để link chia sẻ đi không
    // mang theo mã lỗi.
    searchParams.delete('error')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams, toast])

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
      <h1 className="title-panel dark:text-white">Chào mừng trở lại</h1>
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
