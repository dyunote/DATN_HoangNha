import { Request, Response } from 'express';
import * as cartService from '../services/cartService';
import asyncHandler from '../utils/asyncHandler';
import { success } from '../utils/response';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const { voucher_code } = req.query;
  const cart = await cartService.getCart(req.user!, voucher_code as string | undefined);
  return success(res, cart, 'Lay gio hang thanh cong');
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.addItem(req.user!, req.body);
  return success(res, cart, 'Them vao gio hang thanh cong');
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(req.user!, Number(req.params.itemId), req.body.quantity);
  return success(res, cart, 'Cap nhat gio hang thanh cong');
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(req.user!, Number(req.params.itemId));
  return success(res, cart, 'Xoa san pham khoi gio hang thanh cong');
});

export const selectItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.selectItem(req.user!, Number(req.params.itemId), Boolean(req.body.selected));
  return success(res, cart, 'Cap nhat lua chon san pham thanh cong');
});

export const selectAll = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.selectAll(req.user!, Boolean(req.body.selected));
  return success(res, cart, 'Cap nhat lua chon tat ca san pham thanh cong');
});
