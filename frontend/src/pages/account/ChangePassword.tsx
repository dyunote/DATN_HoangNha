import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { authApi } from '@/api/services'
import { apiMessage } from '@/api/error'
import { usePageTitle } from '@/hooks/usePageTitle'

const schema = z
  .object({
    // Không bắt buộc ở tầng schema: tài khoản tạo bằng Google/Facebook chưa hề
    // có mật khẩu nên không có gì để nhập. Trường hợp có mật khẩu thì kiểm tra
    // ngay trong onSubmit để vẫn báo lỗi ngay dưới ô nhập.
    old: z.string().optional(),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirm: z.string(),
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

const META = ['Quá yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh']

export default function ChangePassword() {
  const { user } = useAuth()
  // Tài khoản đăng nhập bằng Google/Facebook chưa từng đặt mật khẩu → không thể
  // đòi họ nhập "mật khẩu hiện tại". Mặc định coi như CÓ mật khẩu khi server
  // chưa trả cờ, để không vô tình bỏ mất một lớp xác nhận.
  const hasPassword = user?.hasPassword !== false
  usePageTitle(hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu')
  const { toast } = useToast()
  const { register, handleSubmit, watch, reset, setError, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const pw = watch('password') ?? ''
  const strength = strengthOf(pw)

  return (
    <div className="max-w-xl rounded-card bg-white p-7 shadow-sm ring-1 ring-slate-100 lg:p-10 dark:bg-zinc-900 dark:ring-white/10">
      <h1 className="title-panel dark:text-white">{hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}</h1>
      <p className="mt-2 text-sm text-muted">
        {hasPassword
          ? 'Nên dùng mật khẩu mạnh và không dùng lại ở nơi khác.'
          : 'Tài khoản của bạn đang đăng nhập bằng Google/Facebook. Đặt thêm mật khẩu để vẫn vào được khi không dùng mạng xã hội.'}
      </p>

      <form
        onSubmit={handleSubmit(async (data) => {
          if (hasPassword && !data.old) {
            setError('old', { message: 'Vui lòng nhập mật khẩu hiện tại' })
            return
          }
          // UC-18: chỉ báo thành công khi server đã đổi thật. Trước đây lỗi mạng
          // và lỗi 401 bị nuốt rồi vẫn hiện "thành công" — khách tưởng đã đổi
          // mật khẩu trong khi DB không hề thay đổi.
          try {
            await authApi.changePassword(data.old ?? '', data.password)
          } catch (err) {
            toast(apiMessage(err, hasPassword ? 'Đổi mật khẩu thất bại' : 'Đặt mật khẩu thất bại'), 'error')
            return
          }
          toast(hasPassword ? 'Đổi mật khẩu thành công ✓' : 'Đặt mật khẩu thành công ✓')
          reset()
        })}
        className="mt-8 space-y-5"
      >
        {hasPassword && (
          <FormField label="Mật khẩu hiện tại" type="password" error={errors.old?.message} {...register('old')} />
        )}
        <FormField label={hasPassword ? 'Mật khẩu mới' : 'Mật khẩu'} type="password" error={errors.password?.message} {...register('password')} />
        {pw && (
          <div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i < strength ? (strength <= 1 ? 'bg-danger' : strength === 2 ? 'bg-warning' : 'bg-success') : 'bg-slate-200 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Độ mạnh: <b className="text-ink dark:text-white">{META[strength]}</b>
            </p>
          </div>
        )}
        <FormField label={hasPassword ? 'Nhập lại mật khẩu mới' : 'Nhập lại mật khẩu'} type="password" error={errors.confirm?.message} {...register('confirm')} />
        <div className="flex items-center gap-3 rounded-2xl bg-accent/10 p-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <ShieldCheck size={30} className="shrink-0 text-accent-dark" />
          Mật khẩu mạnh gồm ít nhất 8 ký tự, có chữ hoa, chữ số và ký tự đặc biệt.
        </div>
        {/* Khóa nút khi đang gửi: đổi mật khẩu hai lần liên tiếp thì lần thứ
            hai chắc chắn lỗi "mật khẩu hiện tại sai" — gây hoang mang vô cớ */}
        <Button type="submit" size="lg" loading={isSubmitting}>
          {isSubmitting ? 'Đang cập nhật…' : hasPassword ? 'Cập nhật mật khẩu' : 'Đặt mật khẩu'}
        </Button>
      </form>
    </div>
  )
}
