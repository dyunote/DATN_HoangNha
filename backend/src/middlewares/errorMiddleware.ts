import { NextFunction, Request, Response } from 'express';
import { error } from '../utils/response';

// Middleware xu ly route khong ton tai
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ success: false, data: null, message: `Khong tim thay duong dan: ${req.originalUrl}` });
};

// Middleware xu ly loi tap trung
export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  const statusCode = err && typeof err === 'object' && 'statusCode' in err ? Number((err as { statusCode: unknown }).statusCode) : 500;
  const message = err instanceof Error ? err.message : 'Loi may chu noi bo';

  return error(res, message, statusCode || 500);
};
