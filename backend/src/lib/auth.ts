import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Bắt buộc có JWT_SECRET khi chạy thật: để lộ chuỗi mặc định trong mã nguồn
// đồng nghĩa ai cũng tự ký được token admin. Dev thì cho phép dùng tạm.
const SECRET = process.env.JWT_SECRET ?? ''
if (!SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Thiếu JWT_SECRET trong biến môi trường — bắt buộc phải đặt khi chạy production')
  }
  console.warn('⚠ Chưa đặt JWT_SECRET, đang dùng chuỗi mặc định cho môi trường dev')
}
const KEY = SECRET || 'dev-secret'

/**
 * Cùng khoá ký với JWT phiên, xuất ra cho lib/oauth.ts dùng ký `state` chống
 * CSRF. Không tạo khoá thứ hai: thêm một bí mật nữa là thêm một thứ phải cấu
 * hình đúng trên hosting, trong khi hai loại token này đều do chính server
 * này phát và chính nó xác thực.
 */
export const JWT_KEY = KEY

export interface AuthPayload {
  userId: number
  role: string
}

export interface AuthedRequest extends Request {
  auth?: AuthPayload
}

export const signToken = (payload: AuthPayload) => jwt.sign(payload, KEY, { expiresIn: '7d' })

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Chưa đăng nhập' })
    return
  }
  try {
    req.auth = jwt.verify(header.slice(7), KEY) as AuthPayload
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
