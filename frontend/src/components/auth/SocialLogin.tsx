import { useLocation } from 'react-router-dom'
import { FaGoogle, FaFacebookF } from 'react-icons/fa6'
import { oauthUrl } from '@/api/services'

/** Hai trang này chính là nơi đặt nút — quay lại đây sau khi đăng nhập là vô nghĩa. */
const AUTH_PAGES = ['/dang-nhap', '/dang-ky']

const PROVIDERS = [
  { id: 'google', label: 'Google', icon: <FaGoogle /> },
  { id: 'facebook', label: 'Facebook', icon: <FaFacebookF /> },
] as const

export default function SocialLogin() {
  const location = useLocation()

  // Nơi cần quay về sau khi đăng nhập xong. Ưu tiên `from` (do CartContext gửi
  // sang khi khách chưa đăng nhập bấm mua hàng), rồi tới trang đang đứng.
  // KHÔNG dùng location.state để mang qua vòng OAuth: đây là điều hướng cả
  // trang sang Google rồi quay về, state của react-router bay sạch — nên nơi
  // quay về phải đi kèm URL, dưới dạng ?redirect=.
  const from = (location.state as { from?: string } | null)?.from
  const backTo = from ?? (AUTH_PAGES.includes(location.pathname) ? '/tai-khoan' : location.pathname)

  return (
    <>
      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-[11px] tracking-[0.2em] text-muted uppercase">Hoặc tiếp tục với</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              window.location.href = oauthUrl(p.id, backTo)
            }}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-btn border border-slate-200 py-3 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:shadow-lg dark:border-white/15 dark:text-white dark:hover:border-white"
            aria-label={`Đăng nhập bằng ${p.label}`}
          >
            {p.icon}
            <span>{p.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
