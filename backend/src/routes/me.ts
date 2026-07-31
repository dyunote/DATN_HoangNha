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

/* ---------- UC-10: Giỏ hàng (đồng bộ server) ----------
 * Giỏ giờ trỏ vào VARIANT chứ không lưu chuỗi color/size.
 * Nhưng API vẫn nhận/trả color + size như cũ để frontend không phải sửa:
 *  - nhận: variantId, hoặc (productId + color + size) → tự dò ra variant
 *  - trả: đọc color/size từ bảng variants ra ngoài cùng
 */

/** Dò variant từ body: ưu tiên variantId, không có thì tra theo productId+color+size */
async function resolveVariant(body: Record<string, unknown>) {
  if (body.variantId) {
    return prisma.variant.findUnique({ where: { id: Number(body.variantId) } })
  }
  const { productId, color, size } = body as { productId?: number; color?: string; size?: string }
  if (!productId || !color || !size) return null
  return prisma.variant.findUnique({
    where: { productId_color_size: { productId: Number(productId), color, size } },
  })
}

router.get('/cart', async (req: AuthedRequest, res) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.auth!.userId },
    include: {
      variant: true,
      product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
    },
  })
  // Phẳng hóa color/size ra ngoài để giữ nguyên hình dạng JSON cũ
  res.json(items.map((i) => ({
    ...i,
    color: i.variant.color,
    size: i.variant.size,
    unitPrice: i.variant.price ?? i.product.price,
    stock: i.variant.stock,
  })))
})

router.post('/cart', async (req: AuthedRequest, res) => {
  const { quantity = 1 } = req.body ?? {}
  const variant = await resolveVariant(req.body ?? {})
  if (!variant) {
    res.status(400).json({ message: 'Không tìm thấy biến thể (màu/size) của sản phẩm' })
    return
  }
  const qty = Math.max(1, Number(quantity) || 1)
  // Không cho thêm quá tồn kho ngay từ giỏ — chặn sớm thay vì để lỗi lúc đặt hàng
  if (variant.stock < qty) {
    res.status(409).json({ message: `Chỉ còn ${variant.stock} sản phẩm cho biến thể này` })
    return
  }
  const item = await prisma.cartItem.upsert({
    where: { userId_variantId: { userId: req.auth!.userId, variantId: variant.id } },
    update: { quantity: { increment: qty } },
    create: { userId: req.auth!.userId, productId: variant.productId, variantId: variant.id, quantity: qty },
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
  // Đánh giá có thể gắn với BIẾN THỂ khách đã mua (vd "size M hơi chật") —
  // không bắt buộc, thiếu thì để NULL = đánh giá chung cho sản phẩm.
  const variant = await resolveVariant(req.body ?? {})
  if (variant && variant.productId !== Number(productId)) {
    res.status(400).json({ message: 'Biến thể không thuộc sản phẩm này' })
    return
  }
  const review = await prisma.review.create({
    data: {
      userId: req.auth!.userId,
      productId: Number(productId),
      variantId: variant?.id ?? null,
      rating: Math.min(5, Math.max(1, Number(rating))),
      title,
      content,
    },
  })
  res.status(201).json(review)
})

export default router
