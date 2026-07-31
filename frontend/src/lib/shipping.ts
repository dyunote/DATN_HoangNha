/**
 * Biểu phí vận chuyển dùng để HIỂN THỊ tạm tính ở giỏ hàng và trang thanh toán.
 *
 * Nguồn sự thật vẫn là server: khi đặt hàng, backend tự tính lại phí ship và
 * bỏ qua con số client gửi lên (xem `backend/src/routes/orders.ts`, bước 3).
 * Để ở một chỗ duy nhất vì trước đây mỗi trang chép một bản riêng — sửa giá
 * ship là phải nhớ sửa đủ ba nơi, quên một chỗ là số tiền hiện ra khác nhau
 * giữa giỏ hàng, thanh toán và hóa đơn.
 */
export const FREE_SHIP_THRESHOLD = 500_000

export const SHIPPING_RATES: Record<string, number> = {
  standard: 30_000,
  express: 55_000,
}

/**
 * Phí ship dự kiến. Miễn phí khi đơn đạt ngưỡng (chỉ với gói tiêu chuẩn)
 * hoặc khi khách áp voucher loại freeship — khớp điều kiện của backend.
 */
export const estimateShipping = (
  subtotal: number,
  method: string = 'standard',
  voucherType?: string,
): number => {
  if (voucherType === 'freeship') return 0
  if (method === 'standard' && subtotal >= FREE_SHIP_THRESHOLD) return 0
  return SHIPPING_RATES[method] ?? SHIPPING_RATES.standard
}
