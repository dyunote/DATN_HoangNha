import { Request, Response } from 'express';
import * as productService from '../services/productService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { category_id, sort, search, tab } = req.query;
  const products = await productService.list({
    category_id: category_id as string | undefined,
    sort: sort as string | undefined,
    search: search as string | undefined,
    tab: tab as string | undefined,
  });
  return success(res, products, 'Lay danh sach san pham thanh cong');
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getById(Number(req.params.id));
  return success(res, product, 'Lay chi tiet san pham thanh cong');
});

// ----- ADMIN -----
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const { category_id, sort, search, tab } = req.query;
  const products = await productService.adminList({
    category_id: category_id as string | undefined,
    sort: sort as string | undefined,
    search: search as string | undefined,
    tab: tab as string | undefined,
  });
  return success(res, products, 'Lay danh sach san pham thanh cong');
});

export const adminGetById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.adminGetById(Number(req.params.id));
  return success(res, product, 'Lay chi tiet san pham thanh cong');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.create(req.body);
  return success(res, product, 'Them san pham thanh cong', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.update(Number(req.params.id), req.body);
  return success(res, product, 'Cap nhat san pham thanh cong');
});

export const setHidden = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.setHidden(Number(req.params.id), req.body.is_hidden);
  return success(res, product, 'Cap nhat trang thai san pham thanh cong');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await productService.remove(Number(req.params.id));
  return success(res, null, 'Xoa san pham thanh cong');
});
