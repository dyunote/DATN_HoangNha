import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Boc cac ham async controller de tu dong bat loi va chuyen cho error middleware
export default function asyncHandler(fn: AsyncRouteHandler) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
