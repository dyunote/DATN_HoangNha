import { Response } from 'express';

export function success<T>(res: Response, data: T | null = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

export function error(res: Response, message = 'Da xay ra loi', statusCode = 500, data: unknown = null) {
  return res.status(statusCode).json({ success: false, data, message });
}

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
