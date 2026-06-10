import * as userModel from '../models/userModel';
import { AppError } from '../utils/response';

export const listAll = () => userModel.findAll();

export const setLocked = async (id: number, isLocked: boolean) => {
  const user = await userModel.findById(id);
  if (!user) throw new AppError('Khong tim thay nguoi dung', 404);
  if (user.role === 'admin') throw new AppError('Khong the khoa tai khoan quan tri vien', 400);

  await userModel.setLocked(id, isLocked);
  return userModel.findById(id);
};
