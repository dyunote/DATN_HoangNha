import './lib/env.js' // phải đứng đầu: nạp .env trước khi các module khác đọc process.env
import express from 'express'
import 'express-async-errors' // vá Express 4: lỗi trong async handler → error middleware thay vì crash process
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import catalogRoutes from './routes/catalog.js'
import orderRoutes from './routes/orders.js'
import meRoutes from './routes/me.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes, { UPLOAD_DIR } from './routes/upload.js'
import extrasRoutes from './routes/extras.js'
import sepayRoutes from './routes/sepay.js'
import chatRoutes from './routes/chat.js'

const app = express()
const IS_PROD = process.env.NODE_ENV === 'production'

// Sau reverse proxy của hosting (Render, Railway, Nginx, cPanel...) — để Express
// đọc đúng req.protocol / req.ip từ header X-Forwarded-*.
app.set('trust proxy', 1)

// Danh sách domain được gọi API, khai báo trong .env:
//   CORS_ORIGIN="https://hoangnha.vn,https://www.hoangnha.vn"
// Khi dev (NODE_ENV != production) thì mọi cổng localhost đều được phép,
// vì Vite tự nhảy 5173 → 5174... khi cổng bị chiếm.
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean)

if (IS_PROD && allowedOrigins.length === 0) {
  console.warn(
    '⚠ CORS_ORIGIN chưa đặt: chỉ chấp nhận request cùng origin (frontend do chính server này phục vụ).\n' +
      '  Nếu frontend nằm ở tên miền khác, khai báo CORS_ORIGIN trong .env.',
  )
}

app.use(
  cors({
    origin: (origin, callback) => {
      // origin undefined = gọi trực tiếp (curl, Postman, webhook SePay) hoặc
      // cùng origin với server → cho qua
      if (!origin) return callback(null, true)
      const clean = origin.replace(/\/$/, '')
      if (allowedOrigins.includes(clean)) return callback(null, true)
      if (!IS_PROD && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(clean)) return callback(null, true)
      callback(new Error('CORS: origin không được phép'))
    },
  }),
)
// limit 8mb: ảnh base64 phình ~33% so với file gốc (giới hạn 5MB/ảnh)
app.use(express.json({ limit: '8mb' }))

// Ảnh đã upload — truy cập qua <domain>/uploads/<tên file>
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))

// Trang chào của API — liệt kê các endpoint chính
const apiWelcome = (_req: express.Request, res: express.Response) => {
  res.json({
    name: 'Hoàng Nha Fashion API',
    version: '2.0',
    status: 'ok',
    docs: 'Xem docs/erd.md và README.md trong repo',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/register · POST /api/auth/login · GET /api/auth/me',
      oauth: 'GET /api/auth/oauth/:provider · GET /api/auth/oauth/:provider/callback — google | facebook',
      products: 'GET /api/products?category=&q=&sale=&sort=&page= · GET /api/products/:id · GET /api/products/:id/reviews',
      catalog: 'GET /api/categories · GET /api/banners · POST /api/vouchers/validate',
      orders: 'POST /api/orders · GET /api/orders · PATCH /api/orders/:id/cancel (JWT)',
      sepay: 'POST /api/sepay/webhook (API Key) · GET /api/sepay/orders/:id/payment-status (JWT) · POST /api/sepay/simulate/:id (dev)',
      me: 'GET/POST /api/me/addresses · /cart · /notifications · /reviews (JWT)',
      chat: 'POST /api/chat — chat AI hỗ trợ khách hàng (SSE, JWT tùy chọn)',
      admin: 'GET /api/admin/stats · /orders · /customers · /vouchers · /banners · /reviews (JWT Admin)',
    },
  })
}
app.get('/api', apiWelcome)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'Hoàng Nha Fashion API', time: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api', catalogRoutes)
app.use('/api', extrasRoutes)
app.use('/api/sepay', sepayRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/me', meRoutes)
app.use('/api/admin', uploadRoutes) // đặt trước adminRoutes: cùng prefix, route riêng
app.use('/api/admin', adminRoutes)

// ===== Phục vụ luôn bản build của frontend (nếu có) =====
// Deploy 1 dịch vụ duy nhất: chạy `npm run build` ở frontend rồi start backend.
// Khi đó /api và /uploads là đường dẫn tương đối cùng domain → khỏi cần CORS,
// khỏi cần VITE_API_URL. Không có thư mục dist thì backend chạy như API thuần.
const __dirname = dirname(fileURLToPath(import.meta.url))
const CLIENT_DIR = process.env.CLIENT_DIR ?? join(__dirname, '..', '..', 'frontend', 'dist')
const hasClient = existsSync(join(CLIENT_DIR, 'index.html'))

if (hasClient) {
  // index.html không cache: mỗi lần deploy phải nạp lại để lấy hash file mới.
  app.use(express.static(CLIENT_DIR, { maxAge: '7d', index: false }))
  // SPA fallback: /danh-muc, /admin/... do React Router xử lý, không phải file thật.
  // Đặt SAU toàn bộ route /api để không nuốt request API.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
    res.sendFile(join(CLIENT_DIR, 'index.html'))
  })
} else {
  app.get('/', apiWelcome)
}

// 404 cho các endpoint API không tồn tại — trả JSON thay vì HTML mặc định
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint không tồn tại' })
})

// Error handler cuối chuỗi — dịch lỗi Prisma phổ biến thành thông báo dễ hiểu
app.use((err: Error & { code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  if (err.message?.startsWith('CORS:')) {
    res.status(403).json({ message: 'Origin không được phép gọi API này' })
    return
  }
  if (err.code === 'P2003') {
    res.status(400).json({ message: 'Dữ liệu tham chiếu không tồn tại (khóa ngoại không hợp lệ)' })
    return
  }
  if (err.code === 'P2025') {
    res.status(404).json({ message: 'Không tìm thấy bản ghi' })
    return
  }
  if (err.code === 'P2002') {
    res.status(409).json({ message: 'Dữ liệu bị trùng (giá trị phải là duy nhất)' })
    return
  }
  // Lỗi hạ tầng DB: tách riêng để biết ngay là MySQL chưa kết nối được chứ không phải bug code
  if (err.code === 'P1001' || err.code === 'P1000' || err.code === 'P1017') {
    res.status(503).json({ message: 'Không kết nối được MySQL. Kiểm tra DATABASE_URL và máy chủ CSDL.' })
    return
  }
  if (err.code === 'P2021' || err.code === 'P2022') {
    res.status(500).json({ message: 'Bảng/cột chưa tồn tại. Chạy: npx prisma db push trong thư mục backend.' })
    return
  }
  // Khi dev thì trả kèm chi tiết để debug; production giấu đi
  res.status(500).json({
    message: 'Lỗi máy chủ nội bộ',
    ...(!IS_PROD && { detail: err.message, code: err.code }),
  })
})

const PORT = Number(process.env.PORT ?? 4000)
// 0.0.0.0: bắt buộc với hosting chạy container (Render, Railway, Fly...) —
// nghe 127.0.0.1 thì proxy bên ngoài không vào được.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✦ Hoàng Nha API đang chạy ở cổng ${PORT}${hasClient ? ' (kèm giao diện web)' : ''}`)
})
