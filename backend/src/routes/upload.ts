import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adminRequired } from '../lib/auth.js'

const router = Router()

// backend/src/routes/upload.ts → lùi 2 cấp về backend/, rồi vào uploads/
const __dirname = dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = join(__dirname, '..', '..', 'uploads')
mkdirSync(UPLOAD_DIR, { recursive: true })

// Chỉ cho phép ảnh — chặn upload .html/.svg (XSS) hay file thực thi
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

const MAX_BYTES = 5 * 1024 * 1024 // 5MB mỗi ảnh

/**
 * POST /api/admin/upload — nhận data URL base64, ghi ra file, trả về đường dẫn công khai.
 * Dùng base64 qua JSON để khỏi thêm multer; đổi lại payload phình ~33%,
 * nên giới hạn 5MB và cần express.json({ limit }) đủ lớn ở index.ts.
 */
router.post('/upload', adminRequired, (req, res) => {
  const { data } = (req.body ?? {}) as { data?: string }
  const match = /^data:([\w/+-]+);base64,(.+)$/.exec(data ?? '')
  if (!match) {
    res.status(400).json({ message: 'Dữ liệu ảnh không hợp lệ' })
    return
  }
  const [, mime, base64] = match
  const ext = MIME_EXT[mime]
  if (!ext) {
    res.status(400).json({ message: 'Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF, AVIF' })
    return
  }
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length > MAX_BYTES) {
    res.status(413).json({ message: 'Ảnh vượt quá 5MB' })
    return
  }
  // Tên ngẫu nhiên: tránh trùng và tránh path traversal từ tên file người dùng
  const filename = `${randomUUID()}.${ext}`
  writeFileSync(join(UPLOAD_DIR, filename), buffer)
  res.status(201).json({ url: `/uploads/${filename}` })
})

export default router
