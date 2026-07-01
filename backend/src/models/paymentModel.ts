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

// Tim payment theo ma giao dich SePay (chong xu ly trung webhook)
export const findByTransactionId = async (transactionId: string) => {
  const [rows] = await pool.query<PaymentRow[]>('SELECT * FROM payments WHERE transaction_id = ?', [transactionId]);
  return rows[0] || null;
};

// Danh dau da thanh toan tu du lieu webhook SePay
export const markPaidFromWebhook = async (
  orderId: number,
  { transaction_id, gateway, reference_code }: { transaction_id: string; gateway?: string | null; reference_code?: string | null }
) => {
  await pool.query(
    `UPDATE payments
       SET status = 'paid', paid_at = ?, transaction_id = ?, gateway = ?, reference_code = ?
     WHERE order_id = ?`,
    [new Date(), transaction_id, gateway || null, reference_code || null, orderId]
  );
};
