import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'

const schema = z.object({
  name: z.string().min(2, 'Vui lòng nhập họ tên'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^[\d\s]{10,12}$/, 'Số điện thoại không hợp lệ'),
  gender: z.string(),
  birthday: z.string(),
})

type FormData = z.infer<typeof schema>

export default function ProfileInfo() {
  const { user, update } = useAuth()
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      gender: user?.gender ?? 'Nam',
      birthday: user?.birthday ?? '',
    },
  })

  // Chỉ báo thành công khi server đã lưu thật
  const onSubmit = async (data: FormData) => {
    try {
      await update(data)
      toast('Đã cập nhật thông tin cá nhân ✓')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Cập nhật thất bại', 'error')
    }
  }

  return (
    <div className="rounded-card bg-white p-7 shadow-sm ring-1 ring-slate-100 lg:p-10 dark:bg-zinc-900 dark:ring-white/10">
      <h1 className="title-panel dark:text-white">Thông tin cá nhân</h1>
      <p className="mt-2 text-sm text-slate-400">Quản lý thông tin hồ sơ để bảo mật tài khoản.</p>

      {/* Avatar upload */}
      <div className="mt-8 flex items-center gap-6">
        <div className="group relative">
          <img
            src={user?.avatar ?? 'https://i.pravatar.cc/160?img=13'}
            alt="Avatar"
            className="h-24 w-24 rounded-full object-cover ring-4 ring-accent/30"
          />
          <button
            onClick={() => toast('Tính năng upload avatar (demo)', 'info')}
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-ink/50 text-white opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100"
            aria-label="Đổi ảnh đại diện"
          >
            <Camera size={22} />
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold dark:text-white">Ảnh đại diện</p>
          <p className="mt-1 text-xs text-slate-400">JPG, PNG tối đa 2MB. Nên dùng ảnh vuông.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-5 sm:grid-cols-2">
        <FormField label="Họ và tên" error={errors.name?.message} {...register('name')} />
        <FormField label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <FormField label="Số điện thoại" error={errors.phone?.message} {...register('phone')} />
        <div>
          <label className="label-field mb-2 block text-slate-500 dark:text-slate-400">
            Giới tính
          </label>
          <div className="flex gap-3">
            {['Nam', 'Nữ', 'Khác'].map((g) => (
              <label
                key={g}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-input border border-slate-200 py-3.5 text-sm transition-all has-checked:border-ink has-checked:bg-ink has-checked:text-white dark:border-white/15 dark:text-white dark:has-checked:border-white dark:has-checked:bg-white dark:has-checked:text-ink"
              >
                <input type="radio" value={g} className="hidden" {...register('gender')} />
                {g}
              </label>
            ))}
          </div>
        </div>
        <FormField label="Ngày sinh" type="date" error={errors.birthday?.message} {...register('birthday')} />
        <div className="flex items-end">
          {/* Khóa nút khi đang gửi — bấm hai lần là gửi hai request cập nhật */}
          <Button type="submit" size="lg" className="w-full sm:w-auto" loading={isSubmitting}>
            {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </div>
  )
}
