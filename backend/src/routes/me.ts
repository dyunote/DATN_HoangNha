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
  // cart_items chỉ còn FK variant_id (theo ERD) — product JOIN qua variant
  const items = await prisma.cartItem.findMany({
    where: { userId: req.auth!.userId },
    include: {
      variant: {
        include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } },
      },
    },
  })
  // Phẳng hóa color/size/productId ra ngoài để giữ nguyên hình dạng JSON cũ
  res.json(items.map((i) => ({
    ...i,
    productId: i.variant.productId,
    product: i.variant.product,
    color: i.variant.color,
    size: i.variant.size,
    unitPrice: i.variant.price ?? i.variant.product.price,
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
  if (variant.stock === 0) {
    res.status(409).json({ message: 'Biến thể này đã hết hàng' })
    return
  }

  // LỖ HỔNG CŨ: chỉ so `variant.stock < qty` rồi `increment: qty`. Kho còn 6,
  // khách bấm "thêm 5" hai lần → giỏ có 10 món mà không câu lệnh nào chặn,
  // đến bước đặt hàng mới báo lỗi. Phải cộng cả phần ĐANG CÓ trong giỏ.
  const existing = await prisma.cartItem.findUnique({
    where: { userId_variantId: { userId: req.auth!.userId, variantId: variant.id } },
    select: { quantity: true },
  })
  const wanted = (existing?.quantity ?? 0) + qty
  if (wanted > variant.stock) {
    res.status(409).json({
      message: `Chỉ còn ${variant.stock} sản phẩm cho biến thể này${existing ? ` (giỏ của bạn đang có ${existing.quantity})` : ''}`,
    })
    return
  }

  const item = await prisma.cartItem.upsert({
    where: { userId_variantId: { userId: req.auth!.userId, variantId: variant.id } },
    update: { quantity: { increment: qty } },
    create: { userId: req.auth!.userId, variantId: variant.id, quantity: qty },
  })
  res.status(201).json(item)
})

router.put('/cart/:id', async (req: AuthedRequest, res) => {
  const { quantity } = req.body ?? {}
  // LỖ HỔNG CŨ: route này KHÔNG kiểm tồn kho. Chặn ở POST /cart nhưng bỏ ngỏ ở
  // PUT nên khách chỉ cần sửa số lượng trong giỏ lên 999 là qua được.
  const item = await prisma.cartItem.findFirst({
    where: { id: Number(req.params.id), userId: req.auth!.userId },
    include: { variant: { select: { stock: true, color: true, size: true } } },
  })
  if (!item) {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ' })
    return
  }
  const qty = Math.max(1, Number(quantity) || 1)
  if (qty > item.variant.stock) {
    res.status(409).json({
      message: `Biến thể ${item.variant.color}/${item.variant.size} chỉ còn ${item.variant.stock} sản phẩm`,
    })
    return
  }
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: qty } })
  res.json({ message: 'Đã cập nhật', quantity: qty })
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
  // ERD mới: reviews BẮT BUỘC nối vào variants (product suy ra qua variant).
  // Ưu tiên variantId / color+size client gửi lên; không có thì lấy biến thể
  // đầu tiên của sản phẩm làm "đánh giá chung".
  let variant = await resolveVariant(req.body ?? {})
  if (variant && variant.productId !== Number(productId)) {
    res.status(400).json({ message: 'Biến thể không thuộc sản phẩm này' })
    return
  }
  if (!variant) {
    variant = await prisma.variant.findFirst({
      where: { productId: Number(productId) },
      orderBy: { id: 'asc' },
    })
  }
  if (!variant) {
    res.status(400).json({ message: 'Sản phẩm không có biến thể để đánh giá' })
    return
  }
  const review = await prisma.review.create({
    data: {
      userId: req.auth!.userId,
      variantId: variant.id,
      rating: Math.min(5, Math.max(1, Number(rating))),
      title,
      content,
    },
  })
  res.status(201).json(review)
})

export default router
