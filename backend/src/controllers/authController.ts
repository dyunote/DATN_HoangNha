import { Request, Response } from 'express';
import * as authService from '../services/authService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return success(res, result, 'Dang ky tai khoan thanh cong', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  return success(res, result, 'Dang nhap thanh cong');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  return success(res, user, 'Lay thong tin tai khoan thanh cong');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.user!.id, req.body);
  return success(res, user, 'Cap nhat thong tin thanh cong');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.id, req.body);
  return success(res, null, 'Doi mat khau thanh cong');
});
