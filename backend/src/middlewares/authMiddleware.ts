import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { error, AppError } from '../utils/response';
import * as userModel from '../models/userModel';

// Yeu cau dang nhap: kiem tra Bearer token va gan req.user
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Ban can dang nhap de thuc hien thao tac nay', 401);
    }

    const payload = verifyToken(token);
    const user = await userModel.findById(payload.id);

    if (!user) {
      throw new AppError('Tai khoan khong ton tai', 401);
    }

    if (user.is_locked) {
      throw new AppError('Tai khoan cua ban da bi khoa', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof Error && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
      return error(res, 'Token khong hop le hoac da het han', 401);
    }
    next(err);
  }
};

// Cho phep request di tiep du co hay khong co token (dung cho cac trang public)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme === 'Bearer' && token) {
      const payload = verifyToken(token);
      const user = await userModel.findById(payload.id);
      if (user && !user.is_locked) {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    next();
  }
};

// Yeu cau quyen admin (phai dung sau requireAuth)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 'Ban khong co quyen truy cap chuc nang nay', 403);
  }
  next();
};
