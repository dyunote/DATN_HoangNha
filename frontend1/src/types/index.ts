export type UserRole = 'customer' | 'admin';
export type MemberLevel = 'normal' | 'silver' | 'gold' | 'vip';
export type OrderStatus = 'pending' | 'shipping' | 'delivered' | 'canceled';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'e_wallet';
export type PaymentStatus = 'unpaid' | 'paid';
export type DiscountType = 'percent' | 'amount';
export type ProductTab = '' | 'new' | 'bestseller' | 'mostliked';
export type ProductSort = '' | 'price_asc' | 'price_desc' | 'likes';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface Address {
  id: number;
  user_id: number;
  receiver_name: string;
  phone: string;
  province: string;
  address: string;
  is_default: 0 | 1 | boolean;
  created_at: string;
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
  is_new: 0 | 1 | boolean;
  is_featured?: 0 | 1 | boolean;
  sold_count: number;
  is_hidden: 0 | 1 | boolean;
  created_at: string;
  main_image?: string;
  like_count?: number;
  total_stock?: number;
  is_wished?: boolean;
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
  is_selected: 0 | 1 | boolean;
  image: string;
}

export interface Voucher {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  start_date: string;
  end_date: string;
  quantity: number;
  is_active: 0 | 1 | boolean;
  saved?: boolean;
  is_valid?: boolean;
}

export interface Cart {
  cart_id: number;
  items: CartItem[];
  voucher: Voucher | null;
  selected_count: number;
  subtotal: number;
  member_discount_rate: number;
  member_discount: number;
  voucher_discount: number;
  discount_amount: number;
  shipping_fee: number;
  total: number;
}

export interface Payment {
  id: number;
  order_id: number;
  method: PaymentMethod;
  transfer_code: string | null;
  amount: number;
  status: PaymentStatus;
  transaction_id: string | null;
  gateway: string | null;
  reference_code: string | null;
  paid_at: string | null;
  payment_info?: PaymentInfo | null;
}

export interface PaymentInfo {
  method: string;
  amount: number;
  transfer_code: string;
  qr_url: string | null;
  bank: string;
  account_number: string;
  account_name: string;
}

export interface ShippingQuote {
  province: string;
  region: 'bac' | 'trung' | 'nam';
  distance_km: number;
  zone: 'noi_tinh' | 'noi_mien' | 'lien_mien';
  zone_label: string;
  base_fee: number;
  distance_fee: number;
  shipping_fee: number;
  original_fee: number;
  free_shipping: boolean;
  eta_days: string;
}

export interface ProvinceOption {
  name: string;
  region: 'bac' | 'trung' | 'nam';
}

export interface ProvinceListData {
  shop_province: string;
  free_ship_threshold: number;
  provinces: ProvinceOption[];
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
  subtotal?: number;
  discount_amount?: number;
  shipping_fee?: number;
  province?: string | null;
  shipping_distance_km?: number | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items?: OrderItem[];
  payment?: Payment | null;
  payment_info?: PaymentInfo | null;
  shipping?: ShippingQuote | null;
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
  main_ima