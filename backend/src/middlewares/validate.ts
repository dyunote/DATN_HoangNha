import { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { error } from '../utils/response';

// Middleware kiem tra req.body theo schema zod.
// Loi -> tra 400 kem thong bao gop lai; thanh cong -> gan lai body da lam sach.
export const validate = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join('; ');
    return error(res, msg || 'Dữ liệu không hợp lệ', 400);
  }
  req.body = result.data; // du lieu da qua trim/chuan hoa
  next();
};
