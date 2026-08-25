/**
 * Xử lý mã màu HEX cho biến thể sản phẩm.
 *
 * Tách khỏi component `ColorInput` vì hai hàm này còn được dùng ở chỗ khác
 * (validate form sản phẩm trước khi gọi API) — và để file component chỉ export
 * đúng một component, giữ Fast Refresh hoạt động.
 *
 * Quy tắc PHẢI khớp `normalizeHex` ở backend/src/routes/admin.ts.
 */

/** Mã màu hợp lệ: đúng định dạng #RRGGBB (6 chữ số hex, có dấu #) */
export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

export const isValidHex = (v: string): boolean => HEX_PATTERN.test(v)

/**
 * Chuẩn hóa chuỗi người dùng gõ về dạng #RRGGBB.
 * Chấp nhận: "fff", "#fff", "FFFFFF", "#ffffff" → "#FFFFFF".
 * Trả `null` khi không thể hiểu được.
 */
export function normalizeHex(raw: string): string | null {
  const v = raw.trim().replace(/^#/, '')
  // Dạng rút gọn 3 ký tự: #abc = #aabbcc
  if (/^[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}`.toUpperCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v}`.toUpperCase()
  return null
}
