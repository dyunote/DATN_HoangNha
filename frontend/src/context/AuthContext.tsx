import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import type { User } from '@/types'
import { authApi } from '@/api/services'
import { apiMessage } from '@/api/error'

/**
 * Ba trạng thái phiên. Chỉ có `user: User | null` là KHÔNG đủ:
 * ngay sau khi app mount, authApi.me() chưa trả về nên user vẫn là null,
 * không phân biệt được "chưa biết" với "chắc chắn chưa đăng nhập".
 * Guard mà chỉ kiểm tra `!user` sẽ đá người dùng thật về trang đăng nhập
 * mỗi lần F5. Vì vậy cần trạng thái trung gian 'loading'.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthCtx {
  user: User | null
  status: AuthStatus
  /** Đăng nhập qua API. Ném Error kèm thông báo khi thất bại. */
  login: (email: string, password: string) => Promise<void>
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<void>
  logout: () => void
  /** Cập nhật hồ sơ. Ném Error kèm thông báo khi server từ chối. */
  update: (u: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  status: 'unauthenticated',
  login: async () => {},
  register: async () => {},
  logout: () => {},
  update: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  // Nguồn sự thật duy nhất của phiên là JWT + hồ sơ do server trả về.
  // Không suy ra user từ một cờ trong localStorage.
  const [user, setUser] = useState<User | null>(null)
  // Không có token trong localStorage thì không có gì để khôi phục —
  // kết luận 'unauthenticated' ngay, khỏi bắt khách vãng lai chờ skeleton.
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem('hn-token') ? 'loading' : 'unauthenticated',
  )

  // Khôi phục phiên từ JWT khi tải lại trang
  useEffect(() => {
    if (!localStorage.getItem('hn-token')) return
    authApi
      .me()
      .then((u) => {
        setUser(u)
        setStatus('authenticated')
      })
      .catch((err) => {
        // Token không còn hợp lệ (user đã bị xóa / DB reset) → đăng xuất sạch.
        // Lỗi mạng (không có response) thì giữ token, để lần tải sau thử lại.
        if (isAxiosError(err) && err.response && (err.response.status === 401 || err.response.status === 404)) {
          authApi.logout()
          setUser(null)
        }
        // Dù là lỗi gì cũng PHẢI thoát khỏi 'loading'. Nếu backend chết mà
        // vẫn để 'loading' thì guard treo skeleton vĩnh viễn, không vào được
        // trang nào cả.
        setStatus('unauthenticated')
      })
  }, [])

  // Không còn "chế độ demo": backend chưa chạy nghĩa là KHÔNG đăng nhập được.
  // Trước đây lỗi mạng vẫn cho vào bằng một user giả — nguy hiểm vì mọi thứ
  // phía sau (đơn hàng, địa chỉ, quyền admin) đều dựa trên phiên không có thật.
  const login = async (email: string, password: string) => {
    try {
      setUser(await authApi.login(email, password))
      setStatus('authenticated')
    } catch (err) {
      throw new Error(apiMessage(err, 'Đăng nhập thất bại'))
    }
  }

  const register = async (payload: { name: string; email: string; phone: string; password: string }) => {
    try {
      setUser(await authApi.register(payload))
      setStatus('authenticated')
    } catch (err) {
      throw new Error(apiMessage(err, 'Đăng ký thất bại'))
    }
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
    setStatus('unauthenticated')
  }

  // Lấy hồ sơ server trả về làm kết quả cuối, không tự đoán state ở client:
  // trước đây lỗi bị nuốt bằng .catch(() => {}) nên form vẫn hiện dữ liệu mới
  // dù server chưa lưu gì, tải lại trang là mất.
  const update = async (u: Partial<User>) => {
    try {
      setUser(await authApi.updateProfile(u))
    } catch (err) {
      throw new Error(apiMessage(err, 'Cập nhật hồ sơ thất bại'))
    }
  }

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, update }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
