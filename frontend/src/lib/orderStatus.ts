import type { OrderStatus } from '@/types'

/**
 * MÁY TRẠNG THÁI ĐƠN HÀNG (bản frontend).
 *
 * PHẢI khớp `backend/src/lib/orderStatus.ts`. Bản này chỉ để dựng giao diện
 * cho đúng — dropdown chỉ hiện các bước hợp lệ, nút sửa bị khóa đúng lúc.
 * Quyết định cuối cùng luôn là của backend: nó kiểm lại toàn bộ và trả 409
 * nếu client gửi bước nhảy sai (KHÔNG TIN DROPDOWN).
 */
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

/**
 * Đơn đã rời kho → KHÔNG cho sửa sản phẩm / địa chỉ giao nữa.
 * Hàng đang trên đường, sửa địa chỉ lúc này là giao sai chỗ.
 */
export const LOCKED_FOR_EDIT: OrderStatus[] = [
  'shipping',
  'delivered',
  'delivery_failed',
  'returned',
  'cancelled',
]

export const isLockedForEdit = (s: OrderStatus): boolean => LOCKED_FOR_EDIT.includes(s)

/** Trạng thái kết thúc — không còn bước nào đi tiếp */
export const isFinalStatus = (s: OrderStatus): boolean => NEXT_STATUS[s].length === 0

/**
 * Vị trí trên thanh tiến trình 5 bước của trang chi tiết đơn.
 * `-1` = không nằm trên luồng chính (hủy / giao thất bại / hoàn trả) → giao
 * diện hiện khung cảnh báo riêng thay vì thanh tiến trình.
 */
export const STATUS_STEP: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  shipping: 3,
  delivered: 4,
  delivery_failed: -1,
  returned: -1,
  cancelled: -1,
}

/** Các mốc của thanh tiến trình — khớp thứ tự với STATUS_STEP */
export const TIMELINE_STEPS = ['Đặt hàng', 'Xác nhận', 'Chuẩn bị', 'Đang giao', 'Giao thành công'] as const
