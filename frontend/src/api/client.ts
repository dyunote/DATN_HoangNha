import axios from 'axios'

// Mặc định dùng đường dẫn tương đối '/api' -> đi qua proxy của Vite sang backend.
// Cách này chạy được cả khi dev local lẫn khi share qua tunnel (chỉ cần 1 cổng).
export const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
})

// Tự động gắn JWT vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hn-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Token hết hạn → xóa phiên
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('hn-token')) {
      localStorage.removeItem('hn-token')
    }
    return Promise.reject(err)
  },
)

export const setToken = (token: string | null) => {
  if (token) localStorage.setItem('hn-token', token)
  else localStorage.removeItem('hn-token')
}
