import { Request, Response } from 'express';
import * as productService from '../services/productService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { category_id, sort, search, tab, min_price, max_price, page, limit } = req.query;
  const filters = {
    category_id: category_id as string | undefined,
    sort: sort as string | undefined,
    search: search as string | undefined,
    tab: tab as string | undefined,
    min_price: min_price !== undefined ? Number(min_price) : undefined,
    max_price: max_price !== undefined ? Number(max_price) : undefined,
    page: page !== undefined ? Number(page) : undefined,
    limit: limit !== undefined ? Number(limit) : undefined,
  };
  // Co tham so 'page' -> tra ve kem thong tin phan trang; khong thi tra mang nhu cu
  if (page !== undefined) {
    const result = await productService.listPaged(filters, req.user?.id);
    return success(res, result, 'Lay danh sach san pham thanh cong');
  }
  const products = await productService.list(filters, req.user?.id);
  return success(res, products, 'Lay danh sach san pham thanh cong');
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getById(Number(req.params.id), req.user?.id);
  return success(res, product, 'Lay chi tiet san pham thanh cong');
});

// ----- ADMIN -----
export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const { category_id, sort, search, tab, page, limit } = req.query;
  const filters = {
    category_id: category_id as string | undefined,
    sort: sort as string | undefined,
    search: search as string | undefined,
    tab: tab as string | undefined,
    page: page !== undefined ? Number(page) : undefined,
    limit: limit !== undefined ? Number(limit) : undefined,
  };
  // Co tham so 'page' -> tra ve kem thong tin phan trang; khong thi tra mang nhu cu
  if (page !== undefined) {
    const result = await productService.adminListPaged(filters);
    return success(res, result, 'Lay danh sach san pham thanh cong');
  }
  const products = await productService.adminList(filters);
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
