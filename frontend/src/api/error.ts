import { isAxiosError } from 'axios'

/**
 * Rút thông báo lỗi dễ hiểu từ lỗi axios.
 * Ưu tiên `message` do backend trả về, sau đó phân biệt lỗi mạng với lỗi khác —
 * để người dùng biết là "backend chưa chạy" chứ không phải "sai dữ liệu".
 */
export function apiMessage(err: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    if (data?.message) return data.message
    if (!err.response) return 'Không kết nối được máy chủ — kiểm tra backend đang chạy'
    if (err.response.status === 401) return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
    if (err.response.status === 403) return 'Bạn không có quyền thực hiện thao tác này'
  }
  return fallback
}
