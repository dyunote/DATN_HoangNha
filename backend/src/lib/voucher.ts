/**
 * Quy tắc hiệu lực theo THỜI GIAN của voucher — dùng chung cho:
 *  - admin tạo/sửa voucher (validate khoảng ngày)
 *  - danh sách voucher công khai (badge trạng thái)
 *  - kiểm tra mã ở giỏ hàng (/vouchers/validate)
 *  - kiểm tra mã lúc đặt hàng (POST /orders)
 *
 * Để một chỗ vì trước đây mỗi nơi tự so `expiry < new Date()` một kiểu; thêm
 * ngày bắt đầu mà quên sửa một nơi là khách áp được mã chưa tới ngày chạy.
 */

/** Trạng thái hiệu lực tính theo thời gian thực */
export type VoucherWindow = 'upcoming' | 'active' | 'expired'

export interface VoucherDates {
  startDate: Date
  endDate: Date
}

/** Voucher đang ở giai đoạn nào so với thời điểm `now` */
export function voucherWindow(v: VoucherDates, now: Date = new Date()): VoucherWindow {
  if (now < v.startDate) return 'upcoming'
  if (now > v.endDate) return 'expired'
  return 'active'
}

/** Nhãn tiếng Việt của từng giai đoạn — dùng chung cho admin và thông báo lỗi */
export const VOUCHER_WINDOW_LABEL: Record<VoucherWindow, string> = {
  upcoming: 'Sắp diễn ra',
  active: 'Đang hoạt động',
  expired: 'Hết hạn',
}

/**
 * Thông báo từ chối khi khách áp mã ngoài khoảng thời gian.
 * Trả `null` nghĩa là mã đang trong thời gian hiệu lực.
 */
export function voucherWindowError(v: VoucherDates, now: Date = new Date()): string | null {
  const state = voucherWindow(v, now)
  if (state === 'upcoming') {
    return `Mã chưa có hiệu lực. Chương trình bắt đầu từ ${v.startDate.toLocaleString('vi-VN')}`
  }
  if (state === 'expired') {
    return `Mã đã hết hạn từ ${v.endDate.toLocaleString('vi-VN')}`
  }
  return null
}

/**
 * Chuẩn hóa + kiểm tra khoảng ngày admin gửi lên khi tạo/sửa voucher.
 * KHÔNG TIN CLIENT: form đã chặn nhưng API vẫn phải tự kiểm.
 *
 * @param rawStart bỏ trống khi TẠO mới → mặc định hiệu lực ngay (now)
 * @param rawEnd   bắt buộc khi tạo mới
 * @param current  giá trị đang có trong DB (khi SỬA, client có thể chỉ gửi 1 trong 2)
 */
export function parseVoucherDates(
  rawStart: unknown,
  rawEnd: unknown,
  current?: VoucherDates,
): { ok: true; startDate: Date; endDate: Date } | { ok: false; message: string } {
  const toDate = (raw: unknown, fallback?: Date): Date | null => {
    if (raw === undefined || raw === null || raw === '') return fallback ?? null
    const d = new Date(String(raw))
    return Number.isNaN(d.getTime()) ? null : d
  }

  const startDate = toDate(rawStart, current?.startDate ?? new Date())
  if (!startDate) return { ok: false, message: 'Ngày bắt đầu không hợp lệ' }

  const endDate = toDate(rawEnd, current?.endDate)
  if (!endDate) return { ok: false, message: 'Vui lòng chọn ngày kết thúc hợp lệ' }

  if (endDate <= startDate) {
    return { ok: false, message: 'Ngày kết thúc phải sau ngày bắt đầu' }
  }
  return { ok: true, startDate, endDate }
}
