import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'dev-secret'

export interface AuthPayload {
  userId: number
  role: string
}

export interface AuthedRequest extends Request {
  auth?: AuthPayload
}

export const signToken = (payload: AuthPayload) => jwt.sign(payload, SECRET, { expiresIn: '7d' })

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Chưa đăng nhập' })
    return
  }
  try {
    req.auth = jwt.verify(header.slice(7), SECRET) as AuthPayload
    next()
  } catch {
    res.status(401).json({ message: 'Phiên đăng nhập hết hạn' })
  }
}

export function adminRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  authRequired(req, res, () => {
    if (req.auth?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Không có quyền quản trị' })
      return
    }
    next()
  })
}
