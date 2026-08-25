import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { voucherWindowError } from '../lib/voucher.js'

const router = Router()

// Danh mục
router.get('/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  })
  res.json(categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, image: c.image, count: c._count.products })))
})

// Banner hero đang bật
router.get('/banners', async (_req, res) => {
  res.json(await prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }))
})

// Voucher công khai: ĐANG trong thời gian hiệu lực và còn lượt dùng
// — hiển thị ở trang giỏ hàng / thanh toán / tài khoản.
// Voucher "sắp diễn ra" KHÔNG lộ ra đây: khách thấy mà chưa dùng được thì bực.
router.get('/vouchers', async (_req, res) => {
  const now = new Date()
  const list = await prisma.voucher.findMany({
    where: { startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { endDate: 'asc' },
  })
  res.json(
    list
      .filter((v) => v.usedCount < v.usageLimit)
      .map((v) => ({
        id: v.id,
        code: v.code,
        type: v.type,
        value: v.value,
        // Nhãn hiển thị: 15% / 100K / Freeship
        discount: v.type === 'percent' ? `${v.value}%` : v.type === 'fixed' ? `${Math.round(v.value / 1000)}K` : 'Freeship',
        description: v.description,
        minOrder: v.minOrder,
        startDate: v.startDate.toISOString(),
        endDate: v.endDate.toISOString(),
        /** Nhãn hạn dùng đã định dạng sẵn cho UI */
        expiry: v.endDate.toLocaleDateString('vi-VN'),
        /** Số lượt còn lại — giúp khách biết mã sắp hết để dùng sớm */
        remaining: Math.max(0, v.usageLimit - v.usedCount),
      })),
  )
})

// Đánh giá mới nhất đã duyệt — dùng cho section "Khách hàng nói gì" ở trang chủ
router.get('/reviews', async (req, res) => {
  const take = Math.min(20, Number(req.query.limit ?? 6))
  const list = await prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    take,
    // reviews chỉ nối vào variants — tên sản phẩm lấy qua variant.product
    include: {
      user: { select: { name: true, avatar: true } },
      variant: { select: { product: { select: { name: true } } } },
    },
  })
  res.json(
    list.map((r) => ({
      id: r.id,
      name: r.user.name,
      avatar: r.user.avatar,
      rating: r.rating,
      title: r.title,
      content: r.content,
      product: r.variant.product.name,
      date: r.createdAt.toLocaleDateString('vi-VN'),
    })),
  )
})

// UC-11: Validate voucher
router.post('/vouchers/validate', async (req, res) => {
  const { code, subtotal = 0 } = req.body ?? {}
  const v = await prisma.voucher.findUnique({ where: { code: String(code ?? '').toUpperCase() } })
  if (!v) {
    res.status(404).json({ valid: false, message: 'Mã giảm giá không tồn tại' })
    return
  }
  // Chặn cả hai đầu: mã chưa tới ngày chạy cũng không áp được, không riêng hết hạn
  const windowError = voucherWindowError(v)
  if (windowError) {
    res.status(400).json({ valid: false, message: windowError })
    return
  }
  if (v.usedCount >= v.usageLimit) {
    res.status(400).json({ valid: false, message: 'Mã đã hết lượt sử dụng' })
    return
  }
  if (subtotal < v.minOrder) {
    res.status(400).json({ valid: false, message: `Đơn tối thiểu ${v.minOrder.toLocaleString('vi-VN')}đ` })
    return
  }
  const discount = v.type === 'percent' ? Math.round((subtotal * v.value) / 100) : v.type === 'fixed' ? v.value : 0
  res.json({ valid: true, code: v.code, type: v.type, discount, description: v.description })
})

export default router
