import { Request, Response } from 'express';
import * as userService from '../services/userService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.listAll();
  return success(res, users, 'Lay danh sach nguoi dung thanh cong');
});

export const setLocked = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.setLocked(Number(req.params.id), req.body.is_locked);
  return success(res, user, 'Cap nhat trang thai tai khoan thanh cong');
});
