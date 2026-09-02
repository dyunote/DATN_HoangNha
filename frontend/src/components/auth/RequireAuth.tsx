import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

/**
 * Layout route chặn cửa cho nhánh /tai-khoan và /admin.
 *
 * Vì sao phải phân biệt 'loading' chứ không chỉ kiểm tra `!user`:
 * khi F5, AuthProvider phải gọi authApi.me() để đổi JWT lấy hồ sơ. Trong lúc
 * chờ, user vẫn là null. Nếu coi null là "chưa đăng nhập" thì người dùng thật
 * đang ở /tai-khoan/don-hang bấm F5 sẽ bị đá về trang đăng nhập.
 *
 * Ngược lại, lúc 'loading' TUYỆT ĐỐI không render children: chỉ cần render
 * một nhịp là khách vãng lai đã kịp thấy chớp sidebar hồ sơ.
 */
export default function RequireAuth({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, status } = useAuth()
  const { toast } = useToast()
  const location = useLocation()

  const denied = adminOnly && status === 'authenticated' && user !== null && user.role !== 'ADMIN'

  // Toast phải bắn trong effect, không bắn thẳng khi render:
  // setState của ToastProvider trong lúc render component khác là lỗi React.
  useEffect(() => {
    if (denied) toast('Bạn không có quyền truy cập trang quản trị', 'error')
  }, [denied, toast])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-24 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-[1440px] animate-pulse gap-10 lg:grid-cols-[280px_1fr]">
          <div className="h-80 rounded-card bg-slate-200 dark:bg-white/5" />
          <div className="space-y-6">
            <div className="h-32 rounded-card bg-slate-200 dark:bg-white/5" />
            <div className="h-64 rounded-card bg-slate-200 dark:bg-white/5" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || user === null) {
    // Ghi lại trang đang muốn vào để Login đưa quay lại đúng chỗ sau khi đăng nhập.
    return <Navigate to="/dang-nhap" state={{ from: location.pathname + location.search }} replace />
  }

  if (denied) return <Navigate to="/tai-khoan" replace />

  return <Outlet />
}
