import { UserRow } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: UserRow;
    }
  }
}

export {};
