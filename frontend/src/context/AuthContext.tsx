import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import type { User } from '@/types'
import { authApi } from '@/api/services'
import { apiMessage } from '@/api/error'

interface AuthCtx {
  user: User | null
  /** Đăng nhập qua API. Ném Error kèm thông báo khi thất bại. */
  login: (email: string, password: string) => Promise<void>
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<void>
  logout: () => void
  /** Cập nhật hồ sơ. Ném Error kèm thông báo khi server từ chối. */
  update: (u: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  update: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  // Nguồn sự thật duy nhất của phiên là JWT + hồ sơ do server trả về.
  // Không suy ra user từ một cờ trong localStorage.
  const [user, setUser] = useState<User | null>(null)

  // Khôi phục phiên từ JWT khi tải lại trang
  useEffect(() => {
    if (!localStorage.getItem('hn-token')) return
    authApi
      .me()
      .then(setUser)
      .catch((err) => {
        // Token không còn hợp lệ (user đã bị xóa / DB reset) → đăng xuất sạch.
        // Lỗi mạng (không có response) thì giữ token, để lần tải sau thử lại.
        if (isAxiosError(err) && err.response && (err.response.status === 401 || err.response.status === 404)) {
          authApi.logout()
          setUser(null)
        }
      })
  }, [])

  // Không còn "chế độ demo": backend chưa chạy nghĩa là KHÔNG đăng nhập được.
  // Trước đây lỗi mạng vẫn cho vào bằng một user giả — nguy hiểm vì mọi thứ
  // phía sau (đơn hàng, địa chỉ, quyền admin) đều dựa trên phiên không có thật.
  const login = async (email: string, password: string) => {
    try {
      setUser(await authApi.login(email, password))
    } catch (err) {
      throw new Error(apiMessage(err, 'Đăng nhập thất bại'))
    }
  }

  const register = async (payload: { name: string; email: string; phone: string; password: string }) => {
    try {
      setUser(await authApi.register(payload))
    } catch (err) {
      throw new Error(apiMessage(err, 'Đăng ký thất bại'))
    }
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
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
    <AuthContext.Provider value={{ user, login, register, logout, update }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
