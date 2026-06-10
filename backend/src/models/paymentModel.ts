import pool from '../config/db';
import { PaymentRow, PaymentStatus } from '../types';

export const findByOrderId = async (orderId: number) => {
  const [rows] = await pool.query<PaymentRow[]>('SELECT * FROM payments WHERE order_id = ?', [orderId]);
  return rows[0] || null;
};

export const updateStatus = async (orderId: number, status: PaymentStatus) => {
  const paidAt = status === 'paid' ? new Date() : null;
  await pool.query('UPDATE payments SET status = ?, paid_at = ? WHERE order_id = ?', [status, paidAt, orderId]);
};
