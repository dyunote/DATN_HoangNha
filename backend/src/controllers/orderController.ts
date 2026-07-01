import { Request, Response } from 'express';
import * as orderService from '../services/orderService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';
import { OrderStatus } from '../types';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!, req.body);
  return success(res, order, 'Dat hang thanh cong', 201);
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.getMyOrders(req.user!.id);
  return success(res, orders, 'Lay danh sach don hang thanh cong');
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderDetail(req.user!, Number(req.params.id));
  return success(res, order, 'Lay chi tiet don hang thanh cong');
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.cancelMyOrder(req.user!, Number(req.params.id));
  return success(res, order, 'Huy don hang thanh cong');
});

// ----- ADMIN -----
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const orders = await orderService.adminListOrders({ status: status as OrderStatus | undefined });
  return success(res, orders, 'Lay danh sach don hang thanh cong');
});

export const adminUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.adminUpdateStatus(Number(req.params.id), req.body.status);
  return success(res, order, 'Cap nhat trang thai don hang thanh cong');
});
