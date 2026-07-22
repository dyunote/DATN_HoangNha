import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

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

// UC-11: Validate voucher
router.post('/vouchers/validate', async (req, res) => {
  const { code, subtotal = 0 } = req.body ?? {}
  const v = await prisma.voucher.findUnique({ where: { code: String(code ?? '').toUpperCase() } })
  if (!v) {
    res.status(404).json({ valid: false, message: 'Mã giảm giá không tồn tại' })
    return
  }
  if (v.expiry < new Date()) {
    res.status(400).json({ valid: false, message: 'Mã đã hết hạn' })
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
