import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { success, AppError } from '../utils/response';

// Nhan 1 file anh (field 'file'), tra ve URL day du de luu vao product_images.image_url
export const uploadProductImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('Không có file ảnh được tải lên', 400);
  // URL dong theo host hien tai, vd: http://localhost:5000/uploads/products/up_xxx.jpg
  const url = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
  return success(res, { url }, 'Tải ảnh thành công');
});
