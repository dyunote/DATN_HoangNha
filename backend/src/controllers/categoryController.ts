import { Request, Response } from 'express';
import * as categoryService from '../services/categoryService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.listPublic();
  return success(res, categories, 'Lay danh sach danh muc thanh cong');
});

// ----- ADMIN -----
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.listAll();
  return success(res, categories, 'Lay danh sach danh muc thanh cong');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.create(req.body);
  return success(res, category, 'Them danh muc thanh cong', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.update(Number(req.params.id), req.body);
  return success(res, category, 'Cap nhat danh muc thanh cong');
});

export const setHidden = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.setHidden(Number(req.params.id), req.body.is_hidden);
  return success(res, category, 'Cap nhat trang thai danh muc thanh cong');
});
