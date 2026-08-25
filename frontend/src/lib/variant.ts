import type { Product, Variant } from '@/types'

/**
 * Tìm biến thể khớp size + màu đang chọn.
 * Trả undefined khi sản phẩm chưa có mảng variants (mock data cũ)
 * hoặc tổ hợp đó không tồn tại.
 */
export const findVariant = (product: Product, size?: string, color?: string): Variant | undefined =>
  product.variants?.find((v) => v.size === size && v.color === color)

/**
 * Giá thực tế khách phải trả cho tổ hợp size × màu đang chọn.
 *
 * Thứ tự ưu tiên:
 *  1. Giá riêng của biến thể (vd: size XXL đắt hơn)
 *  2. Giá sản phẩm gốc (khi chưa chọn đủ size/màu, hoặc mọi biến thể cùng giá)
 *
 * Lưu ý: đây chỉ là giá HIỂN THỊ. Khi đặt hàng, backend luôn tính lại giá
 * từ DB — client không thể tự khai giá rẻ hơn.
 */
export const getVariantPrice = (product: Product, size?: string, color?: string): number =>
  findVariant(product, size, color)?.price ?? product.price

/** Giá gạch ngang tương ứng với biến thể đang chọn */
export const getVariantOldPrice = (
  product: Product,
  size?: string,
  color?: string,
): number | undefined => findVariant(product, size, color)?.oldPrice ?? product.oldPrice

/** Tồn kho của riêng tổ hợp đang chọn (chưa chọn thì lấy tổng kho sản phẩm) */
export const getVariantStock = (product: Product, size?: string, color?: string): number =>
  findVariant(product, size, color)?.stock ?? product.stock

/**
 * Các size còn hàng ứng với một màu — dùng để làm mờ size đã hết.
 * Chưa có variants (mock) thì coi như còn tất cả.
 */
export const sizesInStock = (product: Product, color?: string): Set<string> => {
  if (!product.variants) return new Set(product.sizes)
  return new Set(product.variants.filter((v) => v.color === color && v.stock > 0).map((v) => v.size))
}

/**
 * Các MÀU còn hàng ứng với một size — để làm mờ chấm màu đã hết.
 *
 * Trước đây chỉ có `sizesInStock`: size hết hàng thì bị gạch, nhưng màu hết
 * hàng vẫn bấm chọn được bình thường, khách chọn xong mới biết không mua nổi.
 * Chưa có variants (mock) thì coi như còn tất cả.
 */
export const colorsInStock = (product: Product, size?: string): Set<string> => {
  if (!product.variants) return new Set(product.colors.map((c) => c.name))
  return new Set(product.variants.filter((v) => v.size === size && v.stock > 0).map((v) => v.color))
}

/** Màu này còn hàng ở BẤT KỲ size nào không — dùng cho danh sách sản phẩm */
export const colorHasAnyStock = (product: Product, color: string): boolean => {
  if (!product.variants) return true
  return product.variants.some((v) => v.color === color && v.stock > 0)
}

/**
 * Tồn kho của cả sản phẩm = TỔNG tồn các biến thể.
 * Chỉ dùng để HIỂN THỊ (badge "Hết hàng" ngoài danh sách) — không bao giờ lưu
 * xuống DB, vì lưu là sinh ra hai nguồn sự thật lệch nhau.
 */
export const totalStock = (product: Product): number =>
  product.variants ? product.variants.reduce((sum, v) => sum + v.stock, 0) : product.stock

/**
 * Số lượng tối đa khách được đặt cho tổ hợp size × màu đang chọn.
 * `0` nghĩa là biến thể đó hết hàng — nút thêm giỏ phải bị khóa.
 */
export const maxOrderable = (product: Product, size?: string, color?: string): number =>
  getVariantStock(product, size, color)
