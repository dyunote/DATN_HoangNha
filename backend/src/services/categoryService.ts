import * as categoryModel from '../models/categoryModel';
import { AppError } from '../utils/response';

export const listPublic = () => categoryModel.findAll({ includeHidden: false });

export const listAll = () => categoryModel.findAll({ includeHidden: true });

export const create = async ({ name }: { name: string }) => {
  if (!name || !name.trim()) {
    throw new AppError('Ten danh muc khong duoc de trong', 400);
  }
  const id = await categoryModel.create({ name: name.trim() });
  return categoryModel.findById(id);
};

export const update = async (id: number, { name, is_hidden }: { name: string; is_hidden?: boolean }) => {
  const category = await categoryModel.findById(id);
  if (!category) throw new AppError('Khong tim thay danh muc', 404);
  if (!name || !name.trim()) {
    throw new AppError('Ten danh muc khong duoc de trong', 400);
  }
  await categoryModel.update(id, { name: name.trim(), is_hidden: !!is_hidden });
  return categoryModel.findById(id);
};

export const setHidden = async (id: number, isHidden: boolean) => {
  const category = await categoryModel.findById(id);
  if (!category) throw new AppError('Khong tim thay danh muc', 404);
  await categoryModel.setHidden(id, isHidden);
  return categoryModel.findById(id);
};
