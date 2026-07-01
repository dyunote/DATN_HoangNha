import pool from '../config/db';
import * as cartModel from '../models/cartModel';
import * as orderModel from '../models/orderModel';
import * as voucherModel from '../models/voucherModel';
import * as paymentModel from '../models/paymentModel';
import { AppError } from '../utils/response';
import { calcCartTotals, isVoucherValid } from '../utils/pricing';
import { quoteShipping } from '../utils/shipping';
import { buildTransferCode, buildPaymentIntent } from '../utils/sepay';
import { OrderStatus, PaymentMethod, UserRow } from '../types';

export const VALID_PAYMENT_METHODS: PaymentMethod[] = ['cod', 'bank_transfer', 'e_wallet'];
export const VALID_STATUSES: OrderStatus[] = ['pending', 'shipping', 'delivered', 'canceled'];

interface CreateOrderInput {
  receiver_name: string;
  phone: string;
  address: string;
  province?: string;
  note?: string | null;
  voucher_code?: string;
  payment_method: string;
}

export const createOrder = async (
  user: UserRow,
  { receiver_name, phone, address, province, note, voucher_code, payment_method }: CreateOrderInput
) => {
  if (!receiver_name || !phone || !address) {
    throw new AppError('Vui long nhap day du ho ten, so dien thoai va dia chi nhan hang', 400);
  }
  if (!(VALID_PAYMENT_METHODS as string[]).includes(payment_method)) {
    throw new AppError('Phuong thuc thanh toan khong hop le', 400);
  }

  const allItems = await cartModel.getItems(user.id);

  // Chi dat hang nhung san pham da tich chon. Neu chua chon -> lay tat ca.
  const selected = allItems.filter((item) => Number(item.is_selected) === 1);
  const items = selected.length ? selected : allItems;

  if (items.length === 0) {
    throw new AppError('Vui long chon san pham can mua', 400);
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

  // Buoc 1: tinh tien hang (chua co phi ship) de biet co duoc freeship khong
  const goods = calcCartTotals(items, { memberLevel: user.member_level, voucher });

  // Buoc 2: tinh phi van chuyen theo tinh nhan (uu tien field province, neu khong co lay tu dia chi)
  const shipQuote = quoteShipping(province || address, { orderAmount: goods.total });

  // Buoc 3: tong tien cuoi = tien hang + phi ship
  const totals = calcCartTotals(items, {
    memberLevel: user.member_level,
    voucher,
    shippingFee: shipQuote.shipping_fee,
  });

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
      subtotal: totals.subtotal,
      discount_amount: totals.discount_amount,
      shipping_fee: totals.shipping_fee,
      province: shipQuote.province,
      shipping_distance_km: shipQuote.distance_km,
      total_amount: totals.total,
    });

    for (const item of items) {
      await orderModel.addOrderDetail(conn, {
        order_id: orderId,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price,
      });
      // Tru kho co dieu kien: neu khong du -> da het hang, rollback toan bo don
      const ok = await orderModel.decrementStock(conn, item.variant_id, item.quantity);
      if (!ok) {
        throw new AppError(
          `San pham "${item.product_name}" (${item.size}/${item.color}) da het hang hoac khong du ton kho`,
          400
        );
      }
      await orderModel.incrementSoldCount(conn, item.product_id, item.quantity);
    }

    const transferCode = payment_method === 'bank_transfer' ? buildTransferCode(orderId) : null;
    await orderModel.createPayment(conn, {
      order_id: orderId,
      method: payment_method as PaymentMethod,
      transfer_code: transferCode,
      amount: totals.total,
    });

    if (voucher) {
      // Tru luot voucher trong transaction; het luot -> rollback ca don
      const okVoucher = await voucherModel.decrementQuantity(conn, voucher.id);
      if (!okVoucher) {
        throw new AppError('Voucher da het luot su dung', 400);
      }
    }

    // Chi xoa khoi gio nhung item da dat hang (giu lai item chua chon)
    await cartModel.removeItems(conn, user.id, items.map((i) => i.cart_item_id));

    await conn.commit();

    const order = await orderModel.findById(orderId);
    const result: Record<string, unknown> = { ...order, shipping: shipQuote };
    // Voi chuyen khoan: tra ve thong tin QR de khach quet thanh toan
    if (payment_method === 'bank_transfer') {
      result.payment_info = buildPaymentIntent(orderId, totals.total);
    }
    return result;
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

// Khach tu huy don khi don con dang cho xu ly (pending)
export const cancelMyOrder = async (user: UserRow, orderId: number) => {
  const order = await orderModel.findById(orderId);
  if (!order) throw new AppError('Khong tim thay don hang', 404);
  if (user.role !== 'admin' && order.user_id !== user.id) {
    throw new AppError('Ban khong co quyen huy don hang nay', 403);
  }
  if (order.status !== 'pending') {
    throw new AppError('Chi co the huy don hang khi don dang cho xu ly', 400);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of order.items || []) {
      await orderModel.incrementStock(conn, item.variant_id, item.quantity);
      await orderModel.decrementSoldCount(conn, item.product_id, item.quantity);
    }
    await orderModel.setStatusTx(conn, orderId, 'canceled');
    // Hoan lai luot su dung voucher (neu don co dung voucher)
    if (order.voucher_id) {
      await voucherModel.incrementQuantity(conn, order.voucher_id);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return orderModel.findById(orderId);
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
