import { Request, Response } from 'express';
import * as paymentModel from '../models/paymentModel';
import * as orderService from '../services/orderService';
import asyncHandler from '../utils/asyncHandler';
import { success, AppError } from '../utils/response';
import { PaymentStatus } from '../types';

export const getByOrder = asyncHandler(async (req: Request, res: Response) => {
  // Dam bao user chi xem duoc payment cua don hang cua chinh minh (hoac admin)
  await orderService.getOrderDetail(req.user!, Number(req.params.orderId));

  const payment = await paymentModel.findByOrderId(Number(req.params.orderId));
  if (!payment) throw new AppError('Khong tim thay thong tin thanh toan', 404);

  return success(res, payment, 'Lay thong tin thanh toan thanh cong');
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
