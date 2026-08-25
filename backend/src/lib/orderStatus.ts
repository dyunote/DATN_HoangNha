/**
 * MÁY TRẠNG THÁI ĐƠN HÀNG — nguồn sự thật DUY NHẤT.
 *
 * Luồng chính (một chiều, chỉ tiến không lùi):
 *   pending → confirmed → preparing → shipping → delivered
 * Nhánh phụ:
 *   pending/confirmed/preparing → cancelled   (hủy khi hàng chưa rời kho)
 *   shipping → delivery_failed                (giao không thành công)
 *   delivery_failed → shipping | cancelled    (giao lại, hoặc thôi luôn)
 *   delivered → returned                      (khách hoàn/trả sau khi nhận)
 *
 * TRẠNG THÁI KẾT THÚC: cancelled, returned — không đổi được nữa.
 *
 * Ràng buộc quan trọng với đơn ĐANG GIAO (shipping):
 *  - KHÔNG được quay về pending/confirmed/preparing
 *  - KHÔNG hủy trực tiếp (hàng đã ra khỏi kho, phải qua "giao thất bại")
 *  - Chỉ đi tiếp sang delivered hoặc delivery_failed
 *
 * `delivered` KHÔNG phải trạng thái kết thúc tuyệt đối: theo luồng nghiệp vụ
 * còn nhánh Hoàn/Trả. Nhưng nó không lùi về đâu được, chỉ tiến sang returned.
 */

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'shipping',
  'delivered',
  'delivery_failed',
  'returned',
  'cancelled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const isOrderStatus = (v: unknown): v is OrderStatus =>
  typeof v === 'string' && (ORDER_STATUSES as readonly string[]).includes(v)

/** Từ mỗi trạng thái chỉ được chuyển sang đúng các trạng thái liệt kê */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipping', 'cancelled'],
  // Đang giao: chỉ tiến, không lùi, không hủy thẳng
  shipping: ['delivered', 'delivery_failed'],
  delivered: ['returned'],
  delivery_failed: ['shipping', 'cancelled'],
  returned: [],
  cancelled: [],
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  shipping: 'Đang giao',
  delivered: 'Giao thành công',
  delivery_failed: 'Giao thất bại',
  returned: 'Hoàn/Trả',
  cancelled: 'Đã hủy',
}

/**
 * Các trạng thái mà đơn coi như KHÔNG còn giữ hàng: phải hoàn kho, hoàn lượt
 * voucher và đóng thanh toán. Dùng chung để không sót nhánh nào.
 */
export const RESTOCK_STATUSES: OrderStatus[] = ['cancelled', 'returned']

/**
 * Đơn đã rời kho, KHÔNG cho sửa sản phẩm / địa chỉ giao nữa.
 * (delivery_failed vẫn khóa: hàng đang trên đường quay về.)
 */
export const LOCKED_FOR_EDIT: OrderStatus[] = [
  'shipping',
  'delivered',
  'delivery_failed',
  'returned',
  'cancelled',
]

export const isFinalStatus = (s: OrderStatus): boolean => NEXT_STATUS[s].length === 0

/**
 * Kiểm tra một bước chuyển trạng thái.
 * @returns null nếu hợp lệ, hoặc thông báo tiếng Việt giải thích vì sao không.
 */
export function checkTransition(from: OrderStatus, to: OrderStatus): string | null {
  if (from === to) return null // chọn lại chính nó = no-op, không coi là lỗi
  if (NEXT_STATUS[from].includes(to)) return null

  const allowed = NEXT_STATUS[from].map((s) => STATUS_LABEL[s]).join(', ')
  if (!allowed) {
    return `Đơn đã ở trạng thái kết thúc "${STATUS_LABEL[from]}" — không thể đổi sang trạng thái khác.`
  }
  return `Không thể chuyển từ "${STATUS_LABEL[from]}" sang "${STATUS_LABEL[to]}". Chỉ được chuyển sang: ${allowed}.`
}
