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

// Token đặt lại mật khẩu: scope riêng purpose='reset' + sống 10 phút.
// authRequired đọc payload thành AuthPayload (không có purpose) nên token này
// KHÔNG thể dùng thay token đăng nhập — và ngược lại token đăng nhập không có
// purpose nên không qua được verifyResetToken.
interface ResetPayload {
  userId: number
  resetId: number // bản ghi password_resets tương ứng — để đánh dấu used_at đúng mã
  purpose: 'reset'
}

export const signResetToken = (userId: number, resetId: number) =>
  jwt.sign({ userId, resetId, purpose: 'reset' } satisfies ResetPayload, SECRET, { expiresIn: '10m' })

export function verifyResetToken(token: string): ResetPayload | null {
  try {
    const payload = jwt.verify(token, SECRET) as Partial<ResetPayload>
    if (payload.purpose !== 'reset' || typeof payload.userId !== 'number' || typeof payload.resetId !== 'number') return null
    return { userId: payload.userId, resetId: payload.resetId, purpose: 'reset' }
  } catch {
    return null
  }
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Chưa đăng nhập' })
    return
  }
  try {
    const payload = jwt.verify(header.slice(7), SECRET) as AuthPayload & { purpose?: string }
    // Token có purpose (vd. token đặt lại mật khẩu) KHÔNG phải token đăng nhập —
    // nếu không chặn thì resetToken 10 phút dùng được cho mọi API cần đăng nhập.
    if (payload.purpose) {
      res.status(401).json({ message: 'Token không hợp lệ' })
      return
    }
    req.auth = payload
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
