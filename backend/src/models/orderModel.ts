import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';
import { OrderDetailRow, OrderRow, OrderStatus, PaymentRow, RevenueByDateRow, StatusCountRow } from '../types';

interface CreateOrderInput {
  user_id: number;
  voucher_id?: number | null;
  receiver_name: string;
  phone: string;
  address: string;
  note?: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  province?: string | null;
  shipping_distance_km?: number | null;
  total_amount: number;
}

export const create = async (
  conn: PoolConnection,
  {
    user_id,
    voucher_id,
    receiver_name,
    phone,
    address,
    note,
    subtotal,
    discount_amount,
    shipping_fee,
    province,
    shipping_distance_km,
    total_amount,
  }: CreateOrderInput
) => {
  const [result] = await conn.query<ResultSetHeader>(
    `INSERT INTO orders
      (user_id, voucher_id, receiver_name, phone, address, note, subtotal, discount_amount, shipping_fee, province, shipping_distance_km, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      voucher_id || null,
      receiver_name,
      phone,
      address,
      note || null,
      subtotal,
      discount_amount,
      shipping_fee,
      province || null,
      shipping_distance_km ?? null,
      total_amount,
    ]
  );
  return result.insertId;
};

interface AddOrderDetailInput {
  order_id: number;
  variant_id: number;
  quantity: number;
  price: number;
}

export const addOrderDetail = async (
  conn: PoolConnection,
  { order_id, variant_id, quantity, price }: AddOrderDetailInput
) => {
  await conn.query('INSERT INTO order_details (order_id, variant_id, quantity, price) VALUES (?, ?, ?, ?)', [
    order_id,
    variant_id,
    quantity,
    price,
  ]);
};

export const createPayment = async (
  conn: PoolConnection,
  { order_id, method, transfer_code, amount }: { order_id: number; method: string; transfer_code?: string | null; amount: number }
) => {
  await conn.query('INSERT INTO payments (order_id, method, transfer_code, amount) VALUES (?, ?, ?, ?)', [
    order_id,
    method,
    transfer_code || null,
    amount,
  ]);
};

// Tru ton kho an toan: chi tru khi con du hang (stock >= quantity).
// Tra ve true neu tru thanh cong, false neu khong du -> nguoi goi tu quyet dinh bao loi.
export const decrementStock = async (conn: PoolConnection, variantId: number, quantity: number): Promise<boolean> => {
  const [res] = await conn.query<ResultSetHeader>(
    'UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?',
    [quantity, variantId, quantity]
  );
  return res.affectedRows > 0;
};

export const incrementSoldCount = async (conn: PoolConnection, productId: number, quantity: number) => {
  await conn.query('UPDATE products SET sold_count = sold_count + ? WHERE id = ?', [quantity, productId]);
};

// Hoan lai ton kho khi huy don
export const incrementStock = async (conn: PoolConnection, variantId: number, quantity: number) => {
  await conn.query('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [quantity, variantId]);
};

// Giam sold_count khi huy don
export const decrementSoldCount = async (conn: PoolConnection, productId: number, quantity: number) => {
  await conn.query('UPDATE products SET sold_count = GREATEST(0, sold_count - ?) WHERE id = ?', [quantity, productId]);
};

// Cap nhat trang thai trong transaction
export const setStatusTx = async (conn: PoolConnection, id: number, status: OrderStatus) => {
  await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
};

export const findByUser = async (userId: number) => {
  const [rows] = await pool.query<OrderRow[]>('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [
    userId,
  ]);
  return rows;
};

export const findAll = async ({ status }: { status?: OrderStatus } = {}) => {
  const where: string[] = [];
  const params: string[] = [];
  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query<OrderRow[]>(
    `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email
     FROM orders o JOIN users u ON u.id = o.user_id
     ${whereSql}
     ORDER BY o.created_at DESC`,
    params
  );
  return rows;
};

export const findById = async (id: number) => {
  const [rows] = await pool.query<OrderRow[]>(
    `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email
     FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
    [id]
  );
  const order = rows[0];
  if (!order) return null;

  const [details] = await pool.query<OrderDetailRow[]>(
    `SELECT od.*, pv.size, pv.color, p.id AS product_id, p.name AS product_name,
       (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC, pi.id ASC LIMIT 1) AS image
     FROM order_details od
     JOIN product_variants pv ON pv.id = od.variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE od.order_id = ?`,
    [id]
  );

  const [payments] = await pool.query<PaymentRow[]>('SELECT * FROM payments WHERE order_id = ?', [id]);

  order.items = details;
  order.payment = payments[0] || null;
  return order;
};

export const updateStatus = async (id: number, status: OrderStatus) => {
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
};

interface TotalRevenueRow extends RowDataPacket {
  total_revenue: number | string;
}

interface OrderCountRow extends RowDataPacket {
  count: number;
}

// ----- Thong ke -----
export const getRevenueStats = async () => {
  const [[totalRevenue]] = await pool.query<TotalRevenueRow[]>(
    `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE status = 'delivered'`
  );
  const [statusCounts] = await pool.query<StatusCountRow[]>(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`);
  const [revenueByDate] = await pool.query<RevenueByDateRow[]>(
    `SELECT DATE(created_at) AS date, SUM(total_amount) AS revenue
     FROM orders
     WHERE status = 'delivered'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`
  );
  const [[orderCount]] = await pool.query<OrderCountRow[]>('SELECT COUNT(*) AS count FROM orders');

  return {
    total_revenue: Number(totalRevenue.total_revenue),
    order_count: orderCount.count,
    status_counts: statusCounts,
    revenue_by_date: revenueByDate,
  };
};
