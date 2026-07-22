import express from 'express'
import 'express-async-errors' // vá Express 4: lỗi trong async handler → error middleware thay vì crash process
import cors from 'cors'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import catalogRoutes from './routes/catalog.js'
import orderRoutes from './routes/orders.js'
import meRoutes from './routes/me.js'
import adminRoutes from './routes/admin.js'
import extrasRoutes from './routes/extras.js'
import sepayRoutes from './routes/sepay.js'

const app = express()

// Cho phép mọi cổng của localhost khi dev: Vite tự nhảy 5173 → 5174, 5175...
// khi cổng bị chiếm. Danh sách cứng ['5173', '4173'] từng gây lỗi
// "Không kết nối được máy chủ" chỉ vì web mở ở cổng khác.
// Khi deploy thật: thay bằng danh sách domain cụ thể, KHÔNG dùng regex mở thế này.
app.use(
  cors({
    origin: (origin, callback) => {
      // origin undefined = gọi trực tiếp (curl, Postman, SePay webhook) → cho qua
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) callback(null, true)
      else callback(new Error('CORS: origin không được phép'))
    },
  }),
)
app.use(express.json())

// Trang chào của API — liệt kê các endpoint chính
app.get(['/api', '/'], (_req, res) => {
  res.json({
    name: 'Hoàng Nha Fashion API',
    version: '2.0',
    status: 'ok',
    docs: 'Xem docs/erd.md và README.md trong repo',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/register · POST /api/auth/login · GET /api/auth/me',
      products: 'GET /api/products?category=&q=&sale=&sort=&page= · GET /api/products/:id · GET /api/products/:id/reviews',
      catalog: 'GET /api/categories · GET /api/banners · POST /api/vouchers/validate',
      orders: 'POST /api/orders · GET /api/orders · PATCH /api/orders/:id/cancel (JWT)',
      sepay: 'POST /api/sepay/webhook (API Key) · GET /api/sepay/orders/:id/payment-status (JWT) · POST /api/sepay/simulate/:id (dev)',
      me: 'GET/POST /api/me/addresses · /cart · /notifications · /reviews (JWT)',
      admin: 'GET /api/admin/stats · /orders · /customers · /vouchers · /banners · /reviews (JWT Admin)',
    },
    accounts: {
      admin: 'admin@hoangnha.vn / admin1234',
      customer: 'duytran.220218@gmail.com / 12345678',
    },
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'Hoàng Nha Fashion API', time: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api', catalogRoutes)
app.use('/api', extrasRoutes)
app.use('/api/sepay', sepayRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/me', meRoutes)
app.use('/api/admin', adminRoutes)

// Error handler cuối chuỗi — dịch lỗi Prisma phổ biến thành thông báo dễ hiểu
app.use((err: Error & { code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
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
  res.status(500).json({ message: 'Lỗi máy chủ nội bộ' })
})

const PORT = Number(process.env.PORT ?? 4000)
app.listen(PORT, () => {
  console.log(`✦ Hoàng Nha API đang chạy tại http://localhost:${PORT}/api`)
})
