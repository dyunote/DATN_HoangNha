import type { ShopSettings } from '@/api/services'

/**
 * Biểu phí vận chuyển dùng để HIỂN THỊ tạm tính ở giỏ hàng và trang thanh toán.
 *
 * Nguồn sự thật vẫn là server: khi đặt hàng, backend tự tính lại phí ship và
 * bỏ qua con số client gửi lên (xem `backend/src/routes/orders.ts`, bước 3).
 * Từ mục A2, cả hai phía đều đọc CÙNG một cấu hình do admin đặt — client lấy
 * qua `useSettings()`, server đọc thẳng từ `lib/settings.ts`.
 */

/** Biểu phí rút từ cấu hình cửa hàng, để hàm tính không phụ thuộc React context */
export type ShippingConfig = Pick<
  ShopSettings,
  'ship_fee_standard' | 'ship_fee_express' | 'freeship_threshold'
>

/**
 * Phí ship dự kiến. Miễn phí khi đơn đạt ngưỡng (chỉ với gói tiêu chuẩn)
 * hoặc khi khách áp voucher loại freeship — khớp điều kiện của backend.
 */
export const estimateShipping = (
  cfg: ShippingConfig,
  subtotal: number,
  method: string = 'standard',
  voucherType?: string,
): number => {
  if (voucherType === 'freeship') return 0
  if (method === 'standard' && subtotal >= cfg.freeship_threshold) return 0
  return method === 'express' ? cfg.ship_fee_express : cfg.ship_fee_standard
}
