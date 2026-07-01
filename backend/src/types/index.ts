import { RowDataPacket } from 'mysql2';

export type UserRole = 'customer' | 'admin';
export type MemberLevel = 'normal' | 'silver' | 'gold' | 'vip';
export type OrderStatus = 'pending' | 'shipping' | 'delivered' | 'canceled';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'e_wallet';
export type PaymentStatus = 'unpaid' | 'paid';
export type DiscountType = 'percent' | 'amount';

export interface UserRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  password: string;
  phone: string | null;
  address: string | null;
  role: UserRole;
  member_level: MemberLevel;
  is_locked: number;
  created_at: string;
}

export interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  is_hidden: number;
}

export interface ProductImageRow extends RowDataPacket {
  id: number;
  image_url: string;
  is_main: number;
}

export interface ProductVariantRow extends RowDataPacket {
  id: number;
  size: string;
  color: string;
  stock: number;
}

export interface VariantWithProductRow extends ProductVariantRow {
  product_id: number;
  product_name: string;
  product_price: number;
  product_hidden: number;
}

export interface ProductRow extends RowDataPacket {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string | null;
  price: number;
  is_new: number;
  sold_count: number;
  is_hidden: number;
  created_at: string;
  main_image?: string;
  like_count?: number;
  total_stock?: number;
  is_wished?: boolean;
  images?: ProductImageRow[];
  variants?: ProductVariantRow[];
}

export interface CartRow extends RowDataPacket {
  id: number;
  user_id: number;
}

export interface CartItemRecordRow extends RowDataPacket {
  id: number;
  cart_id: number;
  variant_id: number;
  quantity: number;
}

export interface CartItemRow extends RowDataPacket {
  cart_item_id: number;
  quantity: number;
  is_selected: number;
  variant_id: number;
  size: string;
  color: string;
  stock: number;
  product_id: number;
  product_name: string;
  price: number;
  image: string | null;
}

export interface VoucherRow extends RowDataPacket {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  quantity: number;
  is_active: number;
}

export interface PaymentRow extends RowDataPacket {
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
}

export interface OrderDetailRow extends RowDataPacket {
  id: number;
  order_id: number;
  variant_id: number;
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string | null;
}

export interface OrderRow extends RowDataPacket {
  id: number;
  user_id: number;
  voucher_id: number | null;
  customer_name?: string;
  customer_email?: string;
  receiver_name: string;
  phone: string;
  address: string;
  note: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  province: string | null;
  shipping_distance_km: number | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items?: OrderDetailRow[];
  payment?: PaymentRow | null;
}

export interface AddressRow extends RowDataPacket {
  id: number;
  user_id: number;
  receiver_name: string;
  phone: string;
  province: string;
  address: string;
  is_default: number;
  created_at: string;
}

export interface WishlistRow extends RowDataPacket {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
}

export interface ReviewRow extends RowDataPacket {
  id: number;
  user_id: number;
  product_id: number;
  user_name?: string;
  rating: number;
  comment: string | null;
  image_url: string | null;
  created_at: string;
}

export interface StatusCountRow extends RowDataPacket {
  status: OrderStatus;
  count: number;
}

export interface RevenueByDateRow extends RowDataPacket {
  date: string;
  revenue: number | string;
}

export interface TopProductRow extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  sold_count: number;
  main_image: string;
}

export interface CartTotals {
  subtotal: number;
  member_