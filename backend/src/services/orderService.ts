import pool from '../config/db';
import * as cartModel from '../models/cartModel';
import * as orderModel from '../models/orderModel';
import * as voucherModel from '../models/voucherModel';
import * as paymentModel from '../models/paymentModel';
import { AppError } from '../utils/response';
import { calcCartTotals, isVoucherValid } from '../utils/pricing';
import { OrderStatus, PaymentMethod, UserRow } from '../types';

export const VALID_PAYMENT_METHODS: PaymentMethod[] = ['cod', 'bank_transfer', 'e_wallet'];
export const VALID_STATUSES: OrderStatus[] = ['pending', 'shipping', 'delivered', 'canceled'];

interface CreateOrderInput {
  receiver_name: string;
  phone: string;
  address: string;
  note?: string | null;
  voucher_code?: string;
  payment_method: string;
}

export const createOrder = async (
  user: UserRow,
  { receiver_name, phone, address, note, voucher_code, payment_method }: CreateOrderInput
) => {
  if (!receiver_name || !phone || !address) {
    throw new AppError('Vui long nhap day du ho ten, so dien thoai va dia chi nhan hang', 400);
  }
  if (!(VALID_PAYMENT_METHODS as string[]).includes(payment_method)) {
    throw new AppError('Phuong thuc thanh toan khong hop le', 400);
  }

  const cart = await cartModel.getOrCreateCart(user.id);
  const items = await cartModel.getItems(cart.id);

  if (items.length === 0) {
    throw new AppError('Gio hang dang trong', 400);
  }

  for (const item of items) {
    if (item.stock < item.quantity) {
      throw new AppError(`San pham "${item.product_name}" (${item.size}/${item.color}) khong du ton kho`, 400);
    }
  }

  let voucher = null;
  if (voucher_code) {
    voucher = await voucherModel.findByCode(voucher_code);
    if (!voucher) throw new AppError('Voucher khong ton tai', 404);
    if (!isVoucherValid(voucher)) throw new AppError('Voucher khong hop le hoac da het han', 400);
  }

  const totals = calcCartTotals(items, { memberLevel: user.member_level, voucher });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const orderId = await orderModel.create(conn, {
      user_id: user.id,
      voucher_id: voucher ? voucher.id : null,
      receiver_name,
      phone,
      address,
      note,
      total_amount: totals.total,
    });

    for (const item of items) {
      await orderModel.addOrderDetail(conn, {
        order_id: orderId,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price,
      });
      await orderModel.decrementStock(conn, item.variant_id, item.quantity);
      await orderModel.incrementSoldCount(conn, item.product_id, item.quantity);
    }

    await orderModel.createPayment(conn, { order_id: orderId, method: payment_method as PaymentMethod });

    if (voucher) {
      await voucherModel.decrementQuantity(voucher.id);
    }

    await cartModel.clearCart(cart.id);

    await conn.commit();
    return orderModel.findById(orderId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getMyOrders = (userId: number) => orderModel.findByUser(userId);

export const getOrderDetail = async (user: UserRow, orderId: number) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new AppError('Khong tim thay don hang', 404);

  if (user.role !== 'admin' && order.user_id !== user.id) {
    throw new AppError('Ban khong co quyen xem don hang nay', 403);
  }
  return order;
};

// ----- ADMIN -----
export const adminListOrders = (filters: { status?: OrderStatus }) => orderModel.findAll(filters);

export const adminUpdateStatus = async (orderId: number, status: string) => {
  if (!(VALID_STATUSES as string[]).includes(status)) {
    throw new AppError('Trang thai don hang khong hop le', 400);
  }
  const order = await orderModel.findById(orderId);
  if (!order) throw new AppError('Khong tim thay don hang', 404);

  await orderModel.updateStatus(orderId, status as OrderStatus);

  if (status === 'delivered') {
    await paymentModel.updateStatus(orderId, 'paid');
  }

  return orderModel.findById(orderId);
};
