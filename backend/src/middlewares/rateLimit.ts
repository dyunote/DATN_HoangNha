import { NextFunction, Request, Response } from 'express';
import { error } from '../utils/response';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export const rateLimit = ({ windowMs, max, message }: RateLimitOptions) => {
  const store = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = store.get(key);

    if (!bucket || now > bucket.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const seconds = Math.ceil((bucket.resetAt - now) / 1000);
      return error(res, message || `Ban thao tac qua nhanh, vui long thu lai sau ${seconds} giay`, 429);
    }
    next();
  };
};
