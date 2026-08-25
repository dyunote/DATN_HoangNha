import type { Prisma } from '@prisma/client'

/**
 * ĐỊNH NGHĨA DOANH THU — nguồn sự thật DUY NHẤT của toàn hệ thống.
 *
 * Trước đây mỗi chỗ tự tính một kiểu: dashboard lấy `SUM(total)` của mọi đơn
 * `status != 'cancelled'`, biểu đồ theo tháng cũng vậy, trang khách hàng lại
 * cộng `total` của đơn chưa hủy. Cách đó sai ở ba điểm:
 *
 *  1. Đơn COD đang giao / đã giao nhưng CHƯA THU TIỀN vẫn được cộng vào doanh
 *     thu — tiền chưa về tài khoản mà báo cáo đã ghi nhận.
 *  2. Lấy `total` nghĩa là cộng luôn PHÍ SHIP vào doanh thu. Phí ship là tiền
 *     thu hộ đơn vị vận chuyển, không phải doanh thu bán hàng của shop.
 *  3. Đơn hoàn/trả (returned) không bị loại.
 *
 * QUY TẮC CHỐT:
 *  - Đơn được tính khi thỏa mãn ĐỒNG THỜI: `status = 'delivered'` (giao thành
 *    công) VÀ `paymentStatus = 'paid'` (đã thực thu tiền).
 *  - Bị loại: đơn hủy, đơn hoàn/trả, đơn pending/confirmed/preparing/shipping,
 *    và đơn COD đã giao nhưng chưa thu tiền.
 *  - Doanh thu = tiền hàng SAU khi trừ voucher = `subtotal - discount`.
 *  - PHÍ SHIP **KHÔNG** tính vào doanh thu (xem SHIPPING_INCLUDED bên dưới).
 */

/** Trạng thái đơn hợp lệ để ghi nhận doanh thu */
export const REVENUE_ORDER_STATUS = 'delivered'
/** Trạng thái thanh toán hợp lệ để ghi nhận doanh thu */
export const REVENUE_PAYMENT_STATUS = 'paid'

/**
 * Phí vận chuyển có được tính vào doanh thu không.
 * MẶC ĐỊNH: KHÔNG — đây là tiền thu hộ đơn vị vận chuyển, shop không giữ lại.
 * Đổi thành `true` nếu shop tự giao và muốn coi phí ship là doanh thu dịch vụ.
 */
export const SHIPPING_INCLUDED = false

/**
 * Điều kiện lọc đơn tính doanh thu — dùng chung cho mọi truy vấn Prisma.
 * Gộp thêm điều kiện khác bằng cách trải ra: `{ ...REVENUE_WHERE, createdAt: {...} }`
 */
export const REVENUE_WHERE = {
  status: REVENUE_ORDER_STATUS,
  paymentStatus: REVENUE_PAYMENT_STATUS,
} satisfies Prisma.OrderWhereInput

/** Các trường tối thiểu cần đọc từ DB để tính được doanh thu của một đơn */
export interface RevenueOrderFields {
  subtotal: number
  discount: number
  shippingFee: number
}

/**
 * Doanh thu của MỘT đơn = tiền hàng sau giảm giá voucher.
 * Không bao giờ âm (voucher lỗi ghi discount > subtotal thì cũng chỉ về 0).
 */
export function orderRevenue(order: RevenueOrderFields): number {
  const goods = Math.max(0, order.subtotal - order.discount)
  return SHIPPING_INCLUDED ? goods + order.shippingFee : goods
}

/** Tổng doanh thu của một danh sách đơn ĐÃ được lọc bằng REVENUE_WHERE */
export function sumRevenue(orders: RevenueOrderFields[]): number {
  return orders.reduce((sum, o) => sum + orderRevenue(o), 0)
}
