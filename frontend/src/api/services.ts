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
  updateProfile: (payload: Partial<User>) => api.put('/auth/me', payload),
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
  reviews: (id: number) => api.get(`/products/${id}/reviews`).then((r) => r.data),
}

export const catalogApi = {
  categories: () => api.get<Category[]>('/categories').then((r) => r.data),
  banners: () => api.get('/banners').then((r) => r.data),
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
  total: number
  user?: { name: string; email: string }
  items: { name: string; image: string; quantity: number; price: number; size: string; color: string }[]
  payment?: { status: 'pending' | 'paid' | 'failed' | 'refunded'; method: string }
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
  items: o.items.map((i) => ({ name: i.name, image: i.image, quantity: i.quantity, price: i.price, size: i.size })),
  total: o.total,
  customer: o.user?.name,
  payment: PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod,
  paymentStatus: o.payment?.status,
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
  bestSellers: { id: number; name: string; price: number; sold: number; image?: string; category: string }[]
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
  /* --- Đối soát thanh toán SePay --- */
  sepayLogs: (unmatchedOnly = false) =>
    api
      .get<{ id: number; transactionId: string; gateway: string | null; payCode: string | null; amount: number; matched: boolean; createdAt: string }[]>(
        '/admin/sepay-logs',
        { params: unmatchedOnly ? { unmatched: 'true' } : undefined },
      )
      .then((r) => r.data),
  confirmPaymentManually: (orderId: string, note?: string) =>
    api.post(`/admin/orders/${orderId}/confirm-payment`, { note }).then((r) => r.data),
  orders: () => api.get<ApiOrder[]>('/admin/orders').then((r) => r.data),
  updateOrderStatus: (id: string, status: string) => api.patch(`/admin/orders/${id}/status`, { status }),
  createProduct: (payload: ProductPayload & { images?: string[] }) =>
    api.post('/admin/products', payload).then((r) => r.data),
  updateProduct: (id: number, payload: Partial<ProductPayload>) =>
    api.put(`/admin/products/${id}`, payload).then((r) => r.data),
  createCategory: (payload: { name: string; slug: string; image?: string }) =>
    api.post('/admin/categories', payload).then((r) => r.data),
  updateCategory: (id: number, payload: { name?: string; slug?: string; image?: string }) =>
    api.put(`/admin/categories/${id}`, payload).then((r) => r.data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
  createVoucher: (payload: { code: string; type: string; value: number; description?: string; minOrder?: number; expiry: string; usageLimit?: number }) =>
    api.post('/admin/vouchers', payload).then((r) => r.data),
  customers: () =>
    api.get<{ id: number; name: string; email: string; avatar: string | null; joined: string; orderCount: number; spent: number }[]>('/admin/customers').then((r) => r.data),
  deleteProduct: (id: number) => api.delete(`/admin/products/${id}`),
  vouchers: () => api.get<ApiVoucher[]>('/admin/vouchers').then((r) => r.data),
  deleteVoucher: (id: number) => api.delete(`/admin/vouchers/${id}`),
  banners: () =>
    api.get<{ id: number; eyebrow: string; title: string; subtitle: string; image: string; active: boolean }[]>('/admin/banners').then((r) => r.data),
  updateBanner: (id: number, payload: { active?: boolean }) => api.put(`/admin/banners/${id}`, payload),
  reviews: () =>
    api.get<{ id: number; rating: number; content: string; approved: boolean; createdAt: string; user: { name: string; avatar: string | null } }[]>('/admin/reviews').then((r) => r.data),
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
  addReview: (payload: { productId: number; rating: number; title?: string; content: string }) =>
    api.post('/me/reviews', payload).then((r) => r.data),
}
