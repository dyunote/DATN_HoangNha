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

/* ==================================================================
 * GIỚI HẠN GIÁ TRỊ GIẢM GIÁ
 * ================================================================== */

/** Voucher phần trăm: chỉ từ 0 đến 100 */
export const PERCENT_MIN = 0
export const PERCENT_MAX = 100

/** Trần số tiền giảm cố định — 100 triệu, đủ rộng cho mọi chương trình thật */
export const FIXED_MAX = 100_000_000

export type VoucherType = 'percent' | 'fixed' | 'freeship'

export const isVoucherType = (v: unknown): v is VoucherType =>
  v === 'percent' || v === 'fixed' || v === 'freeship'

/**
 * Kiểm tra giá trị giảm giá theo LOẠI voucher.
 *
 * VÌ SAO PHẢI CHẶN Ở SERVER: trong DB thật đã có voucher `FREE` loại percent
 * với value = 200. Công thức `discount = subtotal * value / 100` cho ra số
 * tiền giảm GẤP ĐÔI giá trị đơn hàng — khách lấy hàng không mất tiền.
 * Ô input min/max ở form chỉ là gợi ý, ai gọi thẳng API cũng lưu được.
 *
 * @returns giá trị đã chuẩn hóa, hoặc thông báo lỗi tiếng Việt.
 */
export function parseVoucherValue(
  type: unknown,
  rawValue: unknown,
): { ok: true; type: VoucherType; value: number } | { ok: false; message: string } {
  if (!isVoucherType(type)) {
    return { ok: false, message: 'Loại voucher không hợp lệ (chỉ nhận percent | fixed | freeship)' }
  }

  // Freeship không dùng tới `value` — ép về 0 để không có số rác trong DB
  if (type === 'freeship') return { ok: true, type, value: 0 }

  const value = Number(rawValue)
  if (!Number.isFinite(value)) {
    return { ok: false, message: 'Giá trị giảm giá phải là một con số' }
  }

  if (type === 'percent') {
    if (!Number.isInteger(value)) {
      return { ok: false, message: 'Phần trăm giảm phải là số nguyên' }
    }
    if (value < PERCENT_MIN || value > PERCENT_MAX) {
      return {
        ok: false,
        message: `Phần trăm giảm phải nằm trong khoảng ${PERCENT_MIN}–${PERCENT_MAX}% (đang nhập ${value}%)`,
      }
    }
    return { ok: true, type, value }
  }

  // type === 'fixed'
  if (!Number.isInteger(value) || value <= 0) {
    return { ok: false, message: 'Số tiền giảm phải là số nguyên lớn hơn 0' }
  }
  if (value > FIXED_MAX) {
    return { ok: false, message: `Số tiền giảm không được vượt quá ${FIXED_MAX.toLocaleString('vi-VN')}đ` }
  }
  return { ok: true, type, value }
}

/** Đơn tối thiểu: số nguyên >= 0 */
export function parseMinOrder(raw: unknown): { ok: true; minOrder: number } | { ok: false; message: string } {
  if (raw === undefined || raw === null || raw === '') return { ok: true, minOrder: 0 }
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    return { ok: false, message: 'Đơn tối thiểu phải là số nguyên không âm' }
  }
  return { ok: true, minOrder: n }
}

/** Giới hạn lượt sử dụng: số nguyên >= 1 (0 lượt thì tạo mã làm gì) */
export function parseUsageLimit(raw: unknown): { ok: true; usageLimit: number } | { ok: false; message: string } {
  if (raw === undefined || raw === null || raw === '') return { ok: true, usageLimit: 1000 }
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    return { ok: false, message: 'Giới hạn lượt sử dụng phải là số nguyên từ 1 trở lên' }
  }
  return { ok: true, usageLimit: n }
}

/**
 * CHỐT CHẶN CUỐI khi tính tiền giảm: dù DB có dòng dữ liệu sai từ trước
 * (vd percent = 200), số tiền giảm KHÔNG bao giờ vượt quá giá trị đơn hàng.
 * Khách không thể nhận lại tiền từ một mã giảm giá.
 */
export function computeDiscount(
  v: { type: string; value: number },
  subtotal: number,
): number {
  if (v.type === 'percent') {
    // Kẹp phần trăm về [0, 100] ngay tại đây — dữ liệu cũ trong DB có thể sai
    const percent = Math.min(PERCENT_MAX, Math.max(PERCENT_MIN, v.value))
    return Math.min(subtotal, Math.round((subtotal * percent) / 100))
  }
  if (v.type === 'fixed') return Math.min(subtotal, Math.max(0, v.value))
  return 0 // freeship: giảm phí ship, không giảm tiền hàng
}
