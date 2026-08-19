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
  /* --- Quên mật khẩu: 3 bước email → OTP → mật khẩu mới --- */
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email: string, otp: string) =>
    api.post<{ resetToken: string }>('/auth/verify-otp', { email, otp }).then((r) => r.data),
  resetPassword: (resetToken: string, password: string) =>
    api.post('/auth/reset-password', { resetToken, password }),
  logout: () => setToken(null),
}

/* ---------- Cấu hình cửa hàng (backend lưu file JSON, không có bảng) ---------- */
export interface ShopSettings {
  site_name: string
  slogan: string
  contact_email: string
  hotline: string
  address: string
  facebook: string
  instagram: string
  tiktok: string
  ship_fee_standard: number
  ship_fee_express: number
  freeship_threshold: number
}

export const settingsApi = {
  get: () => api.get<ShopSettings>('/settings').then((r) => r.data),
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
        { id: number; rating: number; title: string | null; content: string; author: string; avatar: string | null; variant: string; date: string }[]
      >(`/products/${id}/reviews`)
      .then((r) => r.data),
}

export interface PublicVoucher {
  id: number
  code: string
  type: 'percent' | 'fixed' | 'freeship'
  /** Nhãn hiển thị sẵn: "15%", "100K", "Freeship" */
  discount: string
  description: string
  minOrder: number
  expiry: string
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
  items: { name: string; image: string; quantity: number; price: number; size: string; color: string }[]
  // Thanh toán đã GỘP vào orders (không còn bảng payments riêng)
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  // Vận đơn gộp thẳng trong Order (không còn bảng Shipment riêng)
  shipCarrier?: string | null
  trackingCode?: string | null
}

const PAYMENT_LABELS: Record<string, string> = { cod: 'COD', qr: 'Chuyển khoản QR' }
const SHIP_STATUS: Record<string, string> = {
  shipping: 'in_transit', delivered: 'delivered', confirmed: 'preparing', pending: 'preparing',
}

/** Chuyển order từ backend về shape mà UI đang dùng */
export const mapApiOrder = (o: ApiOrder): Order => ({
  id: o.id,
  date: new Date(o.createdAt).toLocaleDateString('vi-VN'),
  status: o.status as Order['status'],
  items: o.items.map((i) => ({ name: i.name, image: i.image, quantity: i.quantity, price: i.price, size: i.size, color: i.color })),
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
  /** Giả lập đã chuyển khoản — chỉ hoạt động khi backend bật SEPAY_ALLOW_SIMULATE */
  simulate: (orderId: string) =>
    api.post<{ success: boolean; message: string }>(`/sepay/simulate/${orderId}`).then((r) => r.data),
}

export const orderApi = {
  create: (payload: CreateOrderPayload) =>
    api.post<ApiOrder & { sepay: SepayInfo | null }>('/orders', payload).then((r) => r.data),
  list: () => api.get<ApiOrder[]>('/orders').then((r) => r.data),
  get: (id: string) => api.get<ApiOrder>(`/orders/${id}`).then((r) => r.data),
  cancel: (id: string) => api.patch(`/orders/${id}/cancel`).then((r) => r.data),
}

/* ---------- Quản trị ---------- */
export interface AdminStats {
  revenue: number
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

export interface ApiVoucher {
  id: number
  code: string
  type: 'percent' | 'fixed' | 'freeship'
  value: number
  description: string
  minOrder: number
  expiry: string
  usageLimit: number
  usedCount: number
}

export interface ProductPayload {
  name: string
  categoryId: number
  price: number
  oldPrice?: number | null
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
  /* --- Cấu hình hệ thống --- */
  getSettings: () => api.get<ShopSettings>('/admin/settings').then((r) => r.data),
  updateSettings: (patch: Partial<ShopSettings>) =>
    api.put<ShopSettings>('/admin/settings', patch).then((r) => r.data),
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
  updateOrderStatus: (id: string, status: string) => api.patch(`/admin/orders/${id}/status`, { status }),
  createProduct: (
    payload: ProductPayload & {
      images?: string[]
      /** Biến thể khởi tạo — tồn kho nằm ở đây chứ không ở Product */
      variants?: { color: string; colorHex: string; size: string; stock: number }[]
    },
  ) => api.post('/admin/products', payload).then((r) => r.data),
  updateProduct: (
    id: number,
    payload: Partial<ProductPayload> & {
      images?: string[]
      /** Danh sách size mong muốn — backend tự thêm/bớt biến thể cho khớp */
      sizes?: string[]
      /** Tồn kho áp cho các biến thể mới tạo */
      stock?: number
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
  createVoucher: (payload: { code: string; type: string; value: number; description?: string; minOrder?: number; expiry: string; usageLimit?: number }) =>
    api.post('/admin/vouchers', payload).then((r) => r.data),
  updateVoucher: (
    id: number,
    payload: { code?: string; type?: string; value?: number; description?: string; minOrder?: number; expiry?: string; usageLimit?: number },
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
  addReview: (payload: { productId: number; rating: number; title?: string; content: string; color?: string; size?: string }) =>
    api.post('/me/reviews', payload).then((r) => r.data),
}
