import { Request, Response } from 'express';
import * as reviewService from '../services/reviewService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const listForProduct = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await reviewService.listForProduct(Number(req.params.productId));
  return success(res, reviews, 'Lay danh sach danh gia thanh cong');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.create(req.user!, req.body);
  return success(res, review, 'Gui danh gia thanh cong', 201);
});
