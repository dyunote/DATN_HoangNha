import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import type { User } from '@/types'
import { authApi } from '@/api/services'

const DEFAULT_USER: User = {
  name: 'Trần Duy',
  email: 'duytran.220218@gmail.com',
  phone: '0901 234 567',
  avatar: 'https://i.pravatar.cc/160?img=13',
  gender: 'Nam',
  birthday: '2002-02-18',
}

interface AuthCtx {
  user: User | null
  /** Đăng nhập qua API; tự fallback chế độ demo khi backend chưa chạy. Ném Error nếu sai mật khẩu. */
  login: (email: string, password: string) => Promise<void>
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<void>
  logout: () => void
  update: (u: Partial<User>) => void
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  update: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    localStorage.getItem('hn-auth') ? DEFAULT_USER : null,
  )

  // Khôi phục phiên từ JWT khi tải lại trang
  useEffect(() => {
    if (localStorage.getItem('hn-token')) {
      authApi
        .me()
        .then((u) => setUser(u))
        .catch((err) => {
          // Token không còn hợp lệ (user đã bị xóa / DB reset) → đăng xuất sạch
          // để buộc đăng nhập lại. Nếu chỉ là backend chưa chạy (lỗi mạng, không
          // có response) thì GIỮ nguyên phiên, không đăng xuất oan.
          if (isAxiosError(err) && err.response && (err.response.status === 401 || err.response.status === 404)) {
            authApi.logout()
            localStorage.removeItem('hn-auth')
            setUser(null)
          }
        })
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const u = await authApi.login(email, password)
      localStorage.setItem('hn-auth', '1')
      setUser(u)
    } catch (err) {
      // Backend trả lời nhưng từ chối → báo lỗi thật
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.message ?? 'Đăng nhập thất bại')
      }
      // Backend chưa chạy → chế độ demo offline
      localStorage.setItem('hn-auth', '1')
      setUser({ ...DEFAULT_USER, email })
    }
  }

  const register = async (payload: { name: string; email: string; phone: string; password: string }) => {
    try {
      const u = await authApi.register(payload)
      localStorage.setItem('hn-auth', '1')
      setUser(u)
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.message ?? 'Đăng ký thất bại')
      }
      localStorage.setItem('hn-auth', '1')
      setUser({ ...DEFAULT_USER, name: payload.name, email: payload.email, phone: payload.phone })
    }
  }

  const logout = () => {
    authApi.logout()
    localStorage.removeItem('hn-auth')
    setUser(null)
  }

  const update = (u: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...u } : prev))
    authApi.updateProfile(u).catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, update }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
