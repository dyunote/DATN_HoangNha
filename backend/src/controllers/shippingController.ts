import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { success, AppError } from '../utils/response';
import { quoteShipping, getFreeShipThreshold, getShopProvinceName } from '../utils/shipping';
import { PROVINCES } from '../utils/provinces';

// Uoc tinh phi van chuyen theo tinh/dia chi nhan hang
// body: { province?, address?, order_amount? }
export const quote = asyncHandler(async (req: Request, res: Response) => {
  const destination = (req.body.province || req.body.address || '').toString().trim();
  if (!destination) {
    throw new AppError('Vui long cung cap tinh/thanh hoac dia chi nhan hang', 400);
  }
  const orderAmount = Number(req.body.order_amount) || 0;
  const result = quoteShipping(destination, { orderAmount });
  return success(res, result, 'Uoc tinh phi van chuyen thanh cong');
});

// Danh sach tinh/thanh ho tro (cho dropdown chon noi nhan)
export const listProvinces = asyncHandler(async (_req: Request, res: Response) => {
  const data = {
    shop_province: getShopProvinceName(),
    free_ship_threshold: getFreeShipThreshold(),
    provinces: PROVINCES.map((p) => ({ name: p.name, region: p.region })),
  };
  return success(res, data, 'Lay danh sach tinh/thanh thanh cong');
});
