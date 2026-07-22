/** Một tổ hợp size × màu cụ thể — đơn vị thực sự được bán và trừ kho */
export interface Variant {
  id: number
  color: string
  colorHex: string
  size: string
  stock: number
  /** Giá thực tế của biến thể này (backend đã gộp giá riêng và giá sản phẩm) */
  price: number
  oldPrice?: number
}

export interface Product {
  id: number
  name: string
  slug: string
  category: string
  brand: string
  /** Giá thấp nhất trong các biến thể — dùng hiển thị ngoài danh sách */
  price: number
  oldPrice?: number
  /** Khoảng giá khi các biến thể có giá khác nhau */
  minPrice?: number
  maxPrice?: number
  /** true → UI hiện "từ 220.000đ" thay vì một con số cứng */
  hasPriceRange?: boolean
  images: string[]
  colors: { name: string; hex: string }[]
  sizes: string[]
  /** Danh sách biến thể kèm giá + tồn kho riêng. Mock data cũ không có → optional */
  variants?: Variant[]
  material: string
  rating: number
  reviewCount: number
  stock: number
  sold: number
  isNew?: boolean
  isBestSeller?: boolean
  isTrending?: boolean
  flashSale?: boolean
  description: string
  tags: string[]
}

export interface Category {
  id: number
  name: string
  slug: string
  image: string
  count: number
}

export interface CartItem {
  product: Product
  quantity: number
  size: string
  color: string
  /** Giá tại thời điểm thêm vào giỏ, theo đúng biến thể size × màu đã chọn */
  unitPrice: number
}

export interface Review {
  id: number
  author: string
  avatar: string
  rating: number
  date: string
  title: string
  content: string
  productId?: number
}

export interface Address {
  id: number
  label: string
  name: string
  phone: string
  street: string
  ward: string
  district: string
  city: string
  isDefault: boolean
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  date: string
  status: OrderStatus
  items: { name: string; image: string; quantity: number; price: number; size: string }[]
  total: number
  customer?: string
  payment: string
  /* Các trường mở rộng từ backend (tùy chọn — mock không có) */
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod?: string
  shipment?: { carrier: string; trackingCode: string; status: string }
  history?: { status: string; note?: string; time: string }[]
}


export interface Voucher {
  id: number
  code: string
  discount: string
  description: string
  expiry: string
  minOrder: number
  type: 'percent' | 'fixed' | 'freeship'
  used?: boolean
}

export interface Notification {
  id: number
  title: string
  content: string
  time: string
  read: boolean
  type: 'order' | 'promo' | 'system'
}

export interface User {
  name: string
  email: string
  phone: string
  avatar: string
  gender: string
  birthday: string
  /** Có mặt khi đăng nhập qua API — 'ADMIN' thì hiện lối vào trang quản trị */
  role?: 'CUSTOMER' | 'ADMIN'
}
