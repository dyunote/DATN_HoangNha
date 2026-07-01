import { Request, Response } from 'express';
import * as wishlistService from '../services/wishlistService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const products = await wishlistService.list(req.user!.id);
  return success(res, products, 'Lay danh sach yeu thich thanh cong');
});

export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const productId = Number(req.body.product_id ?? req.params.productId);
  const result = await wishlistService.toggle(req.user!, productId);
  return success(res, result, result.wished ? 'Da them vao yeu thich' : 'Da bo khoi yeu thich');
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const productId = Number(req.body.product_id ?? req.params.productId);
  const result = await wishlistService.add(req.user!, productId);
  return success(res, result, 'Da them vao yeu thich', 201);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await wishlistService.remove(req.user!, Number(req.params.productId));
  return success(res, result, 'Da bo khoi yeu thich');
});
