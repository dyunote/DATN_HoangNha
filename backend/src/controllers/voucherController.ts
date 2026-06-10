import { Request, Response } from 'express';
import * as voucherService from '../services/voucherService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const check = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await voucherService.checkVoucher(req.params.code as string);
  return success(res, voucher, 'Voucher hop le');
});

// ----- ADMIN -----
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const vouchers = await voucherService.listAll();
  return success(res, vouchers, 'Lay danh sach voucher thanh cong');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await voucherService.create(req.body);
  return success(res, voucher, 'Them voucher thanh cong', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await voucherService.update(Number(req.params.id), req.body);
  return success(res, voucher, 'Cap nhat voucher thanh cong');
});
