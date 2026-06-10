import { Request, Response } from 'express';
import * as statisticsService from '../services/statisticsService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const stats = await statisticsService.getDashboardStats();
  return success(res, stats, 'Lay du lieu thong ke thanh cong');
});
