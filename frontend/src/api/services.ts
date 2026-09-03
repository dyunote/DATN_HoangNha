import { api, setToken } from './client'
import type { Product, Category, User, Order, Address } from '@/types'

/* ---------- Auth (UC-01, 02, 17, 18) ---------- */
export interface ApiUser extends User {
  id: number
}

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post<{ token: string; user: ApiUser }>('/auth/login', { email, password })
    setToken(data.token)
    return data.user
  },
  async register(payload: { name: string; email: string; phone: string; password: string }) {
    const { data } = await api.post<{ token: string; user: ApiUser }>('/auth/register', payload)
    setToken(data.token)
    return data.user
  },
  async me() {
    const { data } = await api.get<{ user: ApiUser }>('/auth/me')
    return data.user
  },
  /** Trả về hồ sơ SAU khi lưu — client dùng bản của server làm chuẩn */
  async updateProfile(payload: Partial<User>) {
    const { data } = await api.put<{ user: ApiUser }>('/auth/me', payload)
    return data.user
  },
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/me/password', { oldPassword, newPassword }),
  logout: () => setToken(null),
}

/* ---------- Sản phẩm & danh mục (UC-06, 07, 08) ---------- */
export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  totalPages: number
}

export const productApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<ProductListResponse>('/products', { params }).then((r) => r.data),
  get: (id: number) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  /** `variant` = "Đen / M" — biến thể khách đã đánh giá, giúp người sau chọn size */
  reviews: (id: number) =>
    api
      .get<
        {
          id: number; rating: number; title: string | null; content: string
          author: string; avatar: string | null; variant: string; date: string
          /** Gắn với đơn đã giao thành công → hiện badge "Đã mua hàng" */
          verifiedPurchase: boolean
          adminReply: string | null
        }[]
      >(`/products/${id}/reviews`)
      .then((r) => r.data),
}

/** Một lượt mua đủ điều kiện đánh giá (đơn đã giao, chưa đánh giá) */
export interface ReviewOption {
  orderId: string
  variantId: number
  color: string
  size: string
  date: string
  reviewed: boolean
}

export interface ReviewEligibility {
  canReview: boolean
  /** Lý do không đánh giá được — hiện thẳng cho khách đọc */
  reason: string
  options: ReviewOption[]
  purchasedCount: number
}

export interface PublicVoucher {
  id: number
  code: string
  type: 'percent' | 'fixed' | 'freeship'
  /** Giá trị thô: 15 (percent) · 100000 (fixed) · 0 (freeship) */
  value: number
  /** Nhãn hiển thị sẵn: "15%", "100K", "Freeship" */
  discount: string
  description: string
  minOrder: number
  /** ISO — khoảng thời gian hiệu lực do backend lọc sẵn (chỉ trả mã đang chạy) */
  startDate: string
  endDate: string
  /** Hạn dùng đã định dạng dd/mm/yyyy */
  expiry: string
  /** Số lượt sử dụng còn lại */
  remaining: number
}

export interface PublicReview {
  id: number
  name: string
  avatar: string | null
  rating: number
  title: string | null
  content: string
  product: string
  date: string
}

export interface ApiBanner {
  id: number
  eyebrow: string
  title: string
  subtitle: string
  image: string
  cta: string
}

export const catalogApi = {
  categories: () => api.get<Category[]>('/categories').then((r) => r.data),
  banners: () => api.get<ApiBanner[]>('/banners').then((r) => r.data),
  vouchers: () => api.get<PublicVoucher[]>('/vouchers').then((r) => r.data),
  reviews: (limit = 6) => api.get<PublicReview[]>('/reviews', { params: { limit } }).then((r) => r.data),
  validateVoucher: (code: string, subtotal: number) =>
    api.post<{ valid: boolean; discount: number; type: string; message?: string }>('/vouchers/validate', { code, subtotal }).then((r) => r.data),
}

/* ---------- Đơn hàng (UC-12, 14, 15) ---------- */
export interface CreateOrderPayload {
  items: { productId: number; quantity: number; color: string; size: string }[]
  voucherCode?: string
  paymentMethod: string
  shippingMethod: string
  receiverName: string
  receiverPhone: string
  receiverEmail?: string
  addressText: string
  note?: string
}

export interface ApiOrder {
  id: string
  status: string
  paymentMethod: string
  createdAt: string
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  user?: { name: string; email: string }
  items: {
    name: string; image: string; quantity: number; price: number; size: string; color: string
    // Chỉ có ở API đơn của tôi (/api/orders) — danh sách admin không cần
    variantId?: number
    productId?: number
    reviewed?: boolean
  }[]
  // Thanh toán đã GỘP vào orders (không còn bảng payments riêng)
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  // Vận đơn gộp thẳng trong Order (không còn bảng Shipment riêng)
  shipCarrier?: string | null
  trackingCode?: string | null
  // Lý do hủy (cột mới trên orders — xem prisma/migrate-cancel-reason.sql)
  cancelReason?: string | null
  cancelledBy?: 'user' | 'admin' | null
  cancelledAt?: string | null
}

const PAYMENT_LABELS: Record<string, string> = { cod: 'COD', qr: 'Chuyển khoản QR' }
/** Trạng thái đơn → trạng thái vận đơn hiển thị dưới mã tracking */
const SHIP_STATUS: Record<string, string> = {
  pending: 'preparing', confirmed: 'preparing', preparing: 'preparing',
  shipping: 'in_transit', delivered: 'delivered',
  delivery_failed: 'failed', returned: 'returned',
}

/** Chuyển order từ backend về shape mà UI đang dùng */
export const mapApiOrder = (o: ApiOrder): Order => ({
  id: o.id,
  date: new Date(o.createdAt).toLocaleDateString('vi-VN'),
  status: o.status as Order['status'],
  items: o.items.map((i) => ({
    name: i.name, image: i.image, quantity: i.quantity, price: i.price, size: i.size, color: i.color,
    variantId: i.variantId, productId: i.productId, reviewed: i.reviewed,
  })),
  subtotal: o.subtotal,
  shippingFee: o.shippingFee,
  discount: o.discount,
  total: o.total,
  customer: o.user?.name,
  payment: PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod,
  paymentStatus: o.paymentStatus,
  paymentMethod: o.paymentMethod,
  shipment: o.trackingCode
    ? { carrier: o.shipCarrier ?? 'GHN Express', trackingCode: o.trackingCode, status: SHIP_STATUS[o.status] ?? 'preparing' }
    : undefined,
  cancelReason: o.cancelReason ?? null,
  cancelledBy: o.cancelledBy ?? null,
  cancelledAt: o.cancelledAt ?? null,
})

/* ---------- SePay: thanh toán chuyển khoản ngân hàng ---------- */
export interface SepayInfo {
  payCode: string
  qrUrl: string
  bank: string
  accountNumber: string
  amount: number
  expiresAt: string
}

export interface PaymentStatus {
  orderId: string
  /** pending: chờ chuyển khoản · paid: đã nhận tiền · expired: quá hạn QR */
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'refunded'
  orderStatus: string
  amount: number
  payCode: string | null
  expiresAt: string | null
  qrUrl: string | null
  bank: string
  accountNumber: string
}

export const sepayApi = {
  /** Frontend gọi 3 giây/lần khi đang hiện QR để biết tiền đã vào chưa */
  status: (orderId: string) =>
    api.get<PaymentStatus>(`/sepay/orders/${orderId}/payment-status`).then((r) => r.data),
}

export const orderApi = {
  create: (payload: CreateOrderPayload) =>
    api.post<ApiOrder & { sepay: SepayInfo | null }>('/orders', payload).then((r) => r.data),
  list: () => api.get<ApiOrder[]>('/orders').then((r) => r.data),
  get: (id: string) => api.get<ApiOrder>(`/orders/${id}`).then((r) => r.data),
  /** Hủy đơn — `reason` BẮT BUỘC (backend từ chối nếu dưới 10 ký tự) */
  cancel: (id: string, reason: string) => api.patch(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
}

/* ---------- Quản trị ---------- */
export interface AdminStats {
  /**
   * Doanh thu THỰC THU: chỉ đơn giao thành công VÀ đã thanh toán,
   * lấy tiền hàng sau giảm giá voucher. KHÔNG gồm phí ship.
   * Định nghĩa gốc: backend/src/lib/revenue.ts
   */
  revenue: number
  /** Số đơn đã được ghi nhận doanh thu (không phải tổng số đơn) */
  revenueOrderCount?: number
  /** Phí ship có nằm trong `revenue` không — backend mặc định false */
  revenueIncludesShipping?: boolean
  /**
   * Đơn đã giao nhưng CHƯA thu được tiền → chưa tính vào doanh thu.
   * Đây chính là phần chênh giữa "tổng tiền đơn hàng" và "doanh thu".
   */
  unpaidDeliveredCount?: number
  unpaidDeliveredAmount?: number
  orders: number
  customers: number
  products: number
  recentOrders: ApiOrder[]
  bestSellers: { id: number; name: string; price: number; sold: number; image?: string; category: string; stock: number }[]
  /** Doanh thu (triệu đồng) và số đơn theo 7 tháng gần nhất */
  revenueByMonth: { name: string; revenue: number; orders: number }[]
  /** Số lượng đã bán theo danh mục */
  categoryShare: { name: string; value: number }[]
}

/** Trạng thái hiệu lực theo thời gian, backend tính sẵn (lib/voucher.ts) */
export type VoucherWindow = 'upcoming' | 'active' | 'expired'

export interface ApiVoucher {
  id: number
  code: string
  type: 'percent' | 'fixed' | 'freeship'
  value: number
  description: string
  minOrder: number
  /** ISO datetime — `endDate` chính là cột `expiry` cũ đã đổi tên */
  startDate: string
  endDate: string
  usageLimit: number
  usedCount: number
  window: VoucherWindow
}

/** Thuộc tính chung của sản phẩm — KHÔNG gồm khuyến mãi */
export interface ProductPayload {
  name: string
  categoryId: number
  price: number
  brand?: string
  material?: string
  description?: string
}

export interface AdminVariant {
  id: number
  productId: number
  color: string
  colorHex: string
  size: string
  stock: number
  /** null = dùng chung giá sản phẩm gốc */
  price: number | null
  oldPrice: number | null
}

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),
  /* --- Biến thể: giá riêng + tồn kho theo từng tổ hợp size × màu --- */
  variants: (productId: number) =>
    api.get<AdminVariant[]>(`/admin/products/${productId}/variants`).then((r) => r.data),
  createVariant: (
    productId: number,
    payload: { color: string; colorHex?: string; size: string; stock?: number; price?: number | null; oldPrice?: number | null },
  ) => api.post<AdminVariant>(`/admin/products/${productId}/variants`, payload).then((r) => r.data),
  updateVariant: (id: number, payload: Partial<Omit<AdminVariant, 'id' | 'productId'>>) =>
    api.put<AdminVariant>(`/admin/variants/${id}`, payload).then((r) => r.data),
  deleteVariant: (id: number) => api.delete(`/admin/variants/${id}`),
  /* --- Xác nhận thanh toán thủ công (bảng sepay_webhook_logs đã bỏ) --- */
  confirmPaymentManually: (orderId: string, note?: string) =>
    api.post(`/admin/orders/${orderId}/confirm-payment`, { note }).then((r) => r.data),
  orders: () => api.get<ApiOrder[]>('/admin/orders').then((r) => r.data),
  /** `reason` chỉ dùng khi status = 'cancelled' — backend bắt buộc phải có */
  updateOrderStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/admin/orders/${id}/status`, { status, reason }),
  /**
   * Tạo sản phẩm. KHÔNG nhận `oldPrice`: khuyến mãi không thuộc bước khai báo
   * sản phẩm mới — đặt sale ở form SỬA, hoặc dùng voucher ở module riêng.
   */
  createProduct: (
    payload: ProductPayload & {
      images?: string[]
      /** Biến thể khởi tạo — tồn kho nằm ở đây chứ không ở Product */
      variants?: { color: string; colorHex: string; size: string; stock: number }[]
    },
  ) => api.post('/admin/products', payload).then((r) => r.data),
  /**
   * Sửa sản phẩm — nơi DUY NHẤT đặt/gỡ giá sale (`oldPrice`) và bật/tắt
   * các cờ marketing. Cờ không gửi lên = giữ nguyên.
   */
  updateProduct: (
    id: number,
    payload: Partial<ProductPayload> & {
      oldPrice?: number | null
      images?: string[]
      isNew?: boolean
      isBestSeller?: boolean
      isTrending?: boolean
      flashSale?: boolean
    },
  ) => api.put(`/admin/products/${id}`, payload).then((r) => r.data),
  /** Upload 1 ảnh dạng data URL base64 → trả về đường dẫn công khai (/uploads/...) */
  uploadImage: (dataUrl: string) =>
    api.post<{ url: string }>('/admin/upload', { data: dataUrl }, { timeout: 30000 }).then((r) => r.data.url),
  createCategory: (payload: { name: string; slug: string; image?: string }) =>
    api.post('/admin/categories', payload).then((r) => r.data),
  updateCategory: (id: number, payload: { name?: string; slug?: string; image?: string }) =>
    api.put(`/admin/categories/${id}`, payload).then((r) => r.data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
  createVoucher: (payload: { code: string; type: string; value: number; description?: string; minOrder?: number; startDate?: string; endDate: string; usageLimit?: number }) =>
    api.post('/admin/vouchers', payload).then((r) => r.data),
  updateVoucher: (
    id: number,
    payload: { code?: string; type?: string; value?: number; description?: string; minOrder?: number; startDate?: string; endDate?: string; usageLimit?: number },
  ) => api.put(`/admin/vouchers/${id}`, payload).then((r) => r.data),
  customers: () =>
    api.get<{ id: number; name: string; email: string; avatar: string | null; joined: string; orderCount: number; spent: number }[]>('/admin/customers').then((r) => r.data),
  deleteProduct: (id: number) => api.delete(`/admin/products/${id}`),
  vouchers: () => api.get<ApiVoucher[]>('/admin/vouchers').then((r) => r.data),
  deleteVoucher: (id: number) => api.delete(`/admin/vouchers/${id}`),
  banners: () =>
    api.get<{ id: number; eyebrow: string; title: string; subtitle: string; image: string; active: boolean }[]>('/admin/banners').then((r) => r.data),
  createBanner: (payload: { eyebrow?: string; title: string; subtitle?: string; image: string; cta?: string }) =>
    api.post('/admin/banners', payload).then((r) => r.data),
  updateBanner: (
    id: number,
    payload: { eyebrow?: string; title?: string; subtitle?: string; image?: string; cta?: string; active?: boolean },
  ) => api.put(`/admin/banners/${id}`, payload),
  deleteBanner: (id: number) => api.delete(`/admin/banners/${id}`),
  reviews: () =>
    api
      .get<
        {
          id: number
          rating: number
          title: string | null
          content: string
          approved: boolean
          createdAt: string
          user: { name: string; avatar: string | null }
          // reviews chỉ nối vào variants → tên sản phẩm backend lấy qua variant
          variant: { color: string; size: string; product: { name: string } }
          product: { name: string }
        }[]
      >('/admin/reviews')
      .then((r) => r.data),
  approveReview: (id: number) => api.patch(`/admin/reviews/${id}/approve`),
  deleteReview: (id: number) => api.delete(`/admin/reviews/${id}`),
  replyReview: (id: number, reply: string) => api.patch(`/admin/reviews/${id}/reply`, { reply }),
}

export const meApi = {
  addresses: () => api.get<Address[]>('/me/addresses').then((r) => r.data),
  addAddress: (payload: Omit<Address, 'id'>) => api.post('/me/addresses', payload).then((r) => r.data),
  updateAddress: (id: number, payload: Partial<Address>) => api.put(`/me/addresses/${id}`, payload).then((r) => r.data),
  deleteAddress: (id: number) => api.delete(`/me/addresses/${id}`),
  notifications: () => api.get('/me/notifications').then((r) => r.data),
  /**
   * Kiểm tra khách có được đánh giá sản phẩm này không.
   * Backend là nơi quyết định — đây chỉ để giao diện biết hiện form hay không.
   */
  reviewEligibility: (productId: number) =>
    api.get<ReviewEligibility>(`/me/reviews/eligibility/${productId}`).then((r) => r.data),
  addReview: (payload: {
    productId: number
    rating: number
    title?: string
    content: string
    /** Đánh giá thay cho lượt mua nào — lấy từ reviewEligibility().options */
    orderId?: string
    variantId?: number
  }) => api.post('/me/reviews', payload).then((r) => r.data),
}

/* ---------- UC-10: Giỏ hàng đồng bộ server ----------
 * Chỉ dùng khi ĐÃ đăng nhập. Khách vãng lai vẫn giữ giỏ trong localStorage,
 * xem CartContext để biết ranh giới giữa hai tầng lưu trữ.
 */

/** Một dòng giỏ hàng do server trả về — `product` đã đúng shape Product của UI */
export interface ApiCartItem {
  id: number
  quantity: number
  variantId: number
  productId: number
  color: string
  size: string
  /** Giá của đúng biến thể (size × màu), backend đã gộp giá riêng + giá sản phẩm */
  unitPrice: number
  stock: number
  product: Product
}

/** Định danh một dòng giỏ theo BIẾN THỂ, không theo id — xem ghi chú ở me.ts */
export interface CartLineRef {
  productId: number
  color: string
  size: string
}

export const cartApi = {
  list: () => api.get<ApiCartItem[]>('/me/cart').then((r) => r.data),
  /** CỘNG THÊM `quantity` vào dòng giỏ (server tự upsert + kiểm tồn kho) */
  add: (payload: CartLineRef & { quantity: number }) => api.post('/me/cart', payload).then((r) => r.data),
  /** ĐẶT số lượng tuyệt đối — dùng cho ô nhập số lượng trong giỏ */
  setQuantity: (payload: CartLineRef & { quantity: number }) =>
    api.put('/me/cart/item', payload).then((r) => r.data),
  // axios gửi body cho DELETE qua `data` — giữ được cùng cách định danh biến thể
  remove: (payload: CartLineRef) => api.delete('/me/cart/item', { data: payload }).then((r) => r.data),
  clear: () => api.delete('/me/cart').then((r) => r.data),
  /**
   * Gộp giỏ localStorage vào giỏ DB lúc đăng nhập. Trả về giỏ SAU khi gộp.
   * `skipped` = số dòng bị bỏ vì biến thể đã xóa hoặc hết hàng.
   */
  merge: (items: (CartLineRef & { quantity: number })[]) =>
    api.post<{ items: ApiCartItem[]; skipped: number }>('/me/cart/merge', { items }).then((r) => r.data),
}

/* ---------- UC-09: Yêu thích (đồng bộ đa thiết bị) ----------
 * Lưu ở cột JSON `users.wishlist` — KHÔNG có bảng riêng, CSDL vẫn đúng 13 bảng.
 * Khách chưa đăng nhập vẫn thích được, danh sách nằm ở localStorage và được gộp
 * lên server lúc đăng nhập (xem WishlistContext).
 */
export const wishlistApi = {
  list: () => api.get<{ ids: number[] }>('/me/wishlist').then((r) => r.data.ids),
  /** GHI ĐÈ toàn bộ danh sách — mỗi lần bấm tim gửi nguyên trạng thái mới */
  replace: (ids: number[]) => api.put<{ ids: number[] }>('/me/wishlist', { ids }).then((r) => r.data.ids),
  /** Phép HỢP với danh sách đang có trên server — dùng lúc đăng nhập và khi đẩy lại sau lỗi mạng */
  merge: (ids: number[]) => api.post<{ ids: number[] }>('/me/wishlist/merge', { ids }).then((r) => r.data.ids),
}
