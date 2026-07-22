import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, type AuthedRequest } from '../lib/auth.js'

const router = Router()
router.use(authRequired)

/* ---------- UC-19: Sổ địa chỉ ---------- */
router.get('/addresses', async (req: AuthedRequest, res) => {
  res.json(await prisma.address.findMany({ where: { userId: req.auth!.userId }, orderBy: { isDefault: 'desc' } }))
})

router.post('/addresses', async (req: AuthedRequest, res) => {
  const { label, name, phone, street, ward, district, city, isDefault } = req.body ?? {}
  if (!name || !phone || !street || !city) {
    res.status(400).json({ message: 'Thiếu thông tin địa chỉ' })
    return
  }
  if (isDefault) await prisma.address.updateMany({ where: { userId: req.auth!.userId }, data: { isDefault: false } })
  const address = await prisma.address.create({
    data: { userId: req.auth!.userId, label: label ?? 'Nhà riêng', name, phone, street, ward: ward ?? '', district: district ?? '', city, isDefault: !!isDefault },
  })
  res.status(201).json(address)
})

router.put('/addresses/:id', async (req: AuthedRequest, res) => {
  const id = Number(req.params.id)
  const existing = await prisma.address.findFirst({ where: { id, userId: req.auth!.userId } })
  if (!existing) {
    res.status(404).json({ message: 'Không tìm thấy địa chỉ' })
    return
  }
  const { label, name, phone, street, ward, district, city, isDefault } = req.body ?? {}
  if (isDefault) await prisma.address.updateMany({ where: { userId: req.auth!.userId }, data: { isDefault: false } })
  res.json(await prisma.address.update({ where: { id }, data: { label, name, phone, street, ward, district, city, isDefault } }))
})

router.delete('/addresses/:id', async (req: AuthedRequest, res) => {
  await prisma.address.deleteMany({ where: { id: Number(req.params.id), userId: req.auth!.userId } })
  res.json({ message: 'Đã xóa địa chỉ' })
})

/* ---------- UC-10: Giỏ hàng (đồng bộ server) ---------- */
router.get('/cart', async (req: AuthedRequest, res) => {
  res.json(await prisma.cartItem.findMany({
    where: { userId: req.auth!.userId },
    include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } },
  }))
})

router.post('/cart', async (req: AuthedRequest, res) => {
  const { productId, color, size, quantity = 1 } = req.body ?? {}
  const item = await prisma.cartItem.upsert({
    where: { userId_productId_color_size: { userId: req.auth!.userId, productId, color, size } },
    update: { quantity: { increment: quantity } },
    create: { userId: req.auth!.userId, productId, color, size, quantity },
  })
  res.status(201).json(item)
})

router.put('/cart/:id', async (req: AuthedRequest, res) => {
  const { quantity } = req.body ?? {}
  await prisma.cartItem.updateMany({
    where: { id: Number(req.params.id), userId: req.auth!.userId },
    data: { quantity: Math.max(1, Number(quantity) || 1) },
  })
  res.json({ message: 'Đã cập nhật' })
})

router.delete('/cart/:id', async (req: AuthedRequest, res) => {
  await prisma.cartItem.deleteMany({ where: { id: Number(req.params.id), userId: req.auth!.userId } })
  res.json({ message: 'Đã xóa' })
})

/* ---------- UC-22: Thông báo ---------- */
router.get('/notifications', async (req: AuthedRequest, res) => {
  res.json(await prisma.notification.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: 'desc' } }))
})

router.patch('/notifications/read', async (req: AuthedRequest, res) => {
  await prisma.notification.updateMany({ where: { userId: req.auth!.userId }, data: { read: true } })
  res.json({ message: 'Đã đánh dấu tất cả là đã đọc' })
})

/* ---------- UC-23: Viết đánh giá ---------- */
router.post('/reviews', async (req: AuthedRequest, res) => {
  const { productId, rating, title, content } = req.body ?? {}
  if (!productId || !rating || !content) {
    res.status(400).json({ message: 'Thiếu thông tin đánh giá' })
    return
  }
  const review = await prisma.review.create({
    data: { userId: req.auth!.userId, productId: Number(productId), rating: Math.min(5, Math.max(1, Number(rating))), title, content },
  })
  res.status(201).json(review)
})

export default router
