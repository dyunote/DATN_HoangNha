import { Request, Response } from 'express';
import * as addressService from '../services/addressService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

// So dia chi cua toi
export const list = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.listMine(req.user!.id);
  return success(res, addresses, 'Lấy sổ địa chỉ thành công');
});

// Them 1 dia chi moi vao so
export const create = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.create(req.user!.id, req.body);
  return success(res, address, 'Thêm địa chỉ thành công', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.update(req.user!.id, Number(req.params.id), req.body);
  return success(res, address, 'Cập nhật địa chỉ thành công');
});

export const setDefault = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.setDefault(req.user!.id, Number(req.params.id));
  return success(res, address, 'Đã đặt làm địa chỉ mặc định');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await addressService.remove(req.user!.id, Number(req.params.id));
  return success(res, null, 'Xóa địa chỉ thành công');
});
