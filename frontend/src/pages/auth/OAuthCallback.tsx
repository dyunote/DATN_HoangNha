import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { usePageTitle } from '@/hooks/usePageTitle'

/**
 * Điểm hạ cánh của luồng OAuth. Backend đưa người dùng tới đây kèm
 * `#token=...&redirect=...`.
 *
 * Vì sao token nằm ở fragment (#) chứ không phải query (?): trình duyệt KHÔNG
 * bao giờ gửi fragment lên máy chủ. Nhờ vậy token không lọt vào access log của
 * proxy, cũng không rơi vào header Referer khi trang này tải font hay ảnh từ
 * CDN. Chỉ JS của chính trang đọc được — và đọc xong thì xoá ngay.
 */

/** Chỉ nhận đường dẫn nội bộ; '//evil.com' là URL sang tên miền khác. */
const safePath = (value: string | null) => (value && /^\/(?!\/)/.test(value) ? value : '/tai-khoan')

export default function OAuthCallback() {
  usePageTitle('Đang đăng nhập')
  const { loginWithToken } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  // StrictMode chạy effect hai lần khi dev. Lần hai hash đã bị xoá nên sẽ báo
  // lỗi giả; chốt lại để cả luồng chỉ chạy đúng một lượt.
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('token')
    const redirect = safePath(params.get('redirect'))

    // Xoá token khỏi thanh địa chỉ NGAY, trước cả khi gọi API: không để nó nằm
    // lại trong lịch sử trình duyệt hay đập vào mắt người ngồi cạnh.
    window.history.replaceState(null, '', window.location.pathname)

    if (!token) {
      setError('Liên kết đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.')
      return
    }

    loginWithToken(token)
      .then(() => {
        toast('Chào mừng bạn đến với Hoàng Nha! ✨')
        navigate(redirect, { replace: true })
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Không hoàn tất được đăng nhập.')
      })
  }, [loginWithToken, navigate, toast])

  return (
    <AuthLayout>
      {error ? (
        <div className="text-center">
          <ShieldAlert size={40} className="mx-auto text-danger" />
          <h1 className="title-panel mt-5 dark:text-white">Đăng nhập không thành công</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <Link
            to="/dang-nhap"
            className="mt-8 inline-flex items-center justify-center rounded-btn bg-ink px-7 py-3 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-ink"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <div className="text-center" role="status" aria-live="polite">
          <Loader2 size={40} className="mx-auto animate-spin text-accent-dark" />
          <h1 className="title-panel mt-5 dark:text-white">Đang hoàn tất đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Chỉ một giây nữa thôi, đừng đóng trang này nhé.
          </p>
        </div>
      )}
    </AuthLayout>
  )
}
