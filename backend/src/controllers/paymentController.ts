import { Request, Response } from 'express';
import * as paymentModel from '../models/paymentModel';
import * as orderService from '../services/orderService';
import asyncHandler from '../utils/asyncHandler';
import { success, AppError } from '../utils/response';
import { PaymentStatus } from '../types';
import { verifyApiKey, parseOrderIdFromContent, buildPaymentIntent } from '../utils/sepay';

export const getByOrder = asyncHandler(async (req: Request, res: Response) => {
  // Dam bao user chi xem duoc payment cua don hang cua chinh minh (hoac admin)
  await orderService.getOrderDetail(req.user!, Number(req.params.orderId));

  const payment = await paymentModel.findByOrderId(Number(req.params.orderId));
  if (!payment) throw new AppError('Khong tim thay thong tin thanh toan', 404);

  // Neu la chuyen khoan va chua thanh toan -> tra kem thong tin QR de quet lai
  let payment_info = null;
  if (payment.method === 'bank_transfer' && payment.status === 'unpaid') {
    payment_info = buildPaymentIntent(payment.order_id, Number(payment.amount));
  }

  return success(res, { ...payment, payment_info }, 'Lay thong tin thanh toan thanh cong');
});

// ----- WEBHOOK SePay (public, xac thuc bang API Key) -----
// SePay POST JSON khi co bien dong so du. Phai tra ve {success:true}, HTTP 200/201.
export const sepayWebhook = asyncHandler(async (req: Request, res: Response) => {
  // 1) Xac thuc header: "Authorization: Apikey <SEPAY_API_KEY>"
  if (!verifyApiKey(req.headers.authorization)) {
    return res.status(401).json({ success: false, message: 'Sai API Key' });
  }

  const { id, gateway, content, transferType, transferAmount, referenceCode } = req.body || {};

  // 2) Chi xu ly giao dich tien VAO
  if (transferType && transferType !== 'in') {
    return res.json({ success: true, message: 'Bo qua giao dich tien ra' });
  }

  const transactionId = id !== undefined && id !== null ? String(id) : '';
  if (!transactionId) {
    return res.json({ success: true, message: 'Thieu ma giao dich' });
  }

  // 3) Chong xu ly trung: neu da ghi nhan transaction_id nay roi thi bo qua
  const existed = await paymentModel.findByTransactionId(transactionId);
  if (existed) {
    return res.json({ success: true, message: 'Giao dich da duoc xu ly' });
  }

  // 4) Tach ma don hang tu noi dung chuyen khoan (vd "HN12")
  const orderId = parseOrderIdFromContent(content || '');
  if (!orderId) {
    return res.json({ success: true, message: 'Khong tim thay ma don hang trong noi dung' });
  }

  const payment = await paymentModel.findByOrderId(orderId);
  if (!payment) {
    return res.json({ success: true, message: 'Khong tim thay don hang tuong ung' });
  }
  if (payment.status === 'paid') {
    return res.json({ success: true, message: 'Don hang da thanh toan truoc do' });
  }

  // 5) Doi chieu so tien: tien chuyen phai >= so tien can thanh toan
  if (Number(transferAmount) < Number(payment.amount)) {
    return res.json({ success: true, message: 'So tien chuyen chua du, cho doi soat thu cong' });
  }

  // 6) Ghi nhan da thanh toan
  await paymentModel.markPaidFromWebhook(orderId, {
    transaction_id: transactionId,
    gateway,
    reference_code: referenceCode,
  });

  return res.json({ success: true });
});

// ----- ADMIN -----
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['unpaid', 'paid'].includes(status)) {
    throw new AppError('Trang thai thanh toan khong hop le', 400);
  }
  await paymentModel.updateStatus(Number(req.params.orderId), status as PaymentStatus);
  const payment = await paymentModel.findByOrderId(Number(req.params.orderId));
  return success(res, payment, 'Cap nhat trang thai thanh toan thanh cong');
});
