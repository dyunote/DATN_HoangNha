export type UserRole = 'customer' | 'admin';
export type MemberLevel = 'normal' | 'silver' | 'gold' | 'vip';
export type OrderStatus = 'pending' | 'shipping' | 'delivered' | 'canceled';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'e_wallet';
export type PaymentStatus = 'unpaid' | 'paid';
export type DiscountType = 'percent' | 'amount';
export type ProductTab = '' | 'new' | 'featured' | 'bestseller';
export type ProductSort = '' | 'price_asc' | 'price_desc';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: UserRole;
  member_level: MemberLevel;
  is_locked: 0 | 1 | boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  is_hidden: 0 | 1 | boolean;
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_main: 0 | 1 | boolean;
}

export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  stock: number;
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string | null;
  price: number;
  is_featured: 0 | 1 | boolean;
  is_new: 0 | 1 | boolean;
  sold_count: number;
  is_hidden: 0 | 1 | boolean;
  created_at: string;
  main_image?: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ProductListItem extends Omit<Product, 'images' | 'variants'> {
  main_image: string;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  user_name: string;
  rating: number;
  comment: string | null;
  image_url: string | null;
  created_at: string;
}

export interface ProductDetail extends Product {
  rating: { avg_rating: number; total: number };
  reviews: Review[];
}

export interface CartItem {
  cart_item_id: number;
  variant_id: number;
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  stock: number;
  price: number;
  quantity: number;
  image: string;
}

export interface Voucher {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  quantity: number;
  is_active: 0 | 1 | boolean;
}

export interface Cart {
  cart_id: number;
  items: CartItem[];
  voucher: Voucher | null;
  subtotal: number;
  member_discount_rate: number;
  member_discount: number;
  voucher_discount: number;
  total: number;
}

export interface Payment {
  id: number;
  order_id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paid_at: string | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  variant_id: number;
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: number;
  user_id: number;
  voucher_id: number | null;
  customer_name?: string;
  customer_email?: string;
  receiver_name: string;
  phone: string;
  address: string;
  note: string | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items?: OrderItem[];
  payment?: Payment | null;
}

export interface RevenueByDate {
  date: string;
  revenue: number | string;
}

export interface StatusCount {
  status: OrderStatus;
  count: number;
}

export interface TopProduct {
  id: number;
  name: string;
  price: number;
  sold_count: number;
  main_image: string;
}

export interface DashboardStats {
  total_revenue: number;
  order_count: number;
  status_counts: StatusCount[];
  revenue_by_date: RevenueByDate[];
  top_products: TopProduct[];
}
