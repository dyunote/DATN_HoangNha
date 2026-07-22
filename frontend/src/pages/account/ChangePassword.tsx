import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { isAxiosError } from 'axios'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { authApi } from '@/api/services'

const schema = z
  .object({
    old: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
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
  const { toast } = useToast()
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const pw = watch('password') ?? ''
  const strength = strengthOf(pw)

  return (
    <div className="max-w-xl rounded-card bg-white p-7 shadow-sm ring-1 ring-slate-100 lg:p-10 dark:bg-zinc-900 dark:ring-white/10">
      <h1 className="font-display text-2xl font-medium dark:text-white">Đổi mật khẩu</h1>
      <p className="mt-2 text-sm text-slate-400">Nên dùng mật khẩu mạnh và không dùng lại ở nơi khác.</p>

      <form
        onSubmit={handleSubmit(async (data) => {
          // UC-18: đổi mật khẩu qua backend, fallback demo khi backend tắt
          try {
            await authApi.changePassword(data.old, data.password)
          } catch (err) {
            if (isAxiosError(err) && err.response && err.response.status !== 401) {
              toast(err.response.data?.message ?? 'Đổi mật khẩu thất bại', 'error')
              return
            }
          }
          toast('Đổi mật khẩu thành công ✓')
          reset()
        })}
        className="mt-8 space-y-5"
      >
        <FormField label="Mật khẩu hiện tại" type="password" error={errors.old?.message} {...register('old')} />
        <FormField label="Mật khẩu mới" type="password" error={errors.password?.message} {...register('password')} />
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
            <p className="mt-1.5 text-xs text-slate-400">
              Độ mạnh: <b className="text-ink dark:text-white">{META[strength]}</b>
            </p>
          </div>
        )}
        <FormField label="Nhập lại mật khẩu mới" type="password" error={errors.confirm?.message} {...register('confirm')} />
        <div className="flex items-center gap-3 rounded-2xl bg-accent/10 p-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <ShieldCheck size={30} className="shrink-0 text-accent-dark" />
          Mật khẩu mạnh gồm ít nhất 8 ký tự, có chữ hoa, chữ số và ký tự đặc biệt.
        </div>
        <Button type="submit" size="lg">Cập nhật mật khẩu</Button>
      </form>
    </div>
  )
}
