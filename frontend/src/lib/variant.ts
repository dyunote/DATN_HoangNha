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
