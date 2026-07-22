import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { adminRequired, type AuthedRequest } from '../lib/auth.js'
import { restoreOrderResources } from '../lib/orderActions.js'

const router = Router()
router.use(adminRequired)

/* ---------- UC-24/32: Dashboard & Thống kê ---------- */
router.get('/stats', async (_req, res) => {
  const [orderCount, customerCount, productCount, revenueAgg, recentOrders, bestSellers] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'cancelled' } } }),
    prisma.order.findMany({ take: 6, orderBy: { createdAt: 'desc' }, include: { items: { take: 1 }, user: { select: { name: true } } } }),
    prisma.product.findMany({ take: 6, orderBy: { sold: 'desc' }, include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true } }),
  ])
  res.json({
    revenue: revenueAgg._sum.total ?? 0,
    orders: orderCount,
    customers: customerCount,
    products: productCount,
    recentOrders,
    bestSellers: bestSellers.map((p) => ({ id: p.id, name: p.name, price: p.price, sold: p.sold, image: p.images[0]?.url, category: p.category.name })),
  })
})

/* ---------- UC-27: Đơn hàng ---------- */
router.get('/orders', async (_req, res) => {
  res.json(await prisma.order.findMany({ include: { items: true, user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' } }))
})

// Máy trạng thái đơn hàng: từ mỗi trạng thái chỉ được chuyển sang các trạng thái
// liệt kê. Chỉ tiến, không lùi. Hủy chỉ khi chưa giao (pending/confirmed).
// - shipping (đang giao): chỉ được → delivered. KHÔNG hủy, KHÔNG lùi.
// - delivered/cancelled: trạng thái kết thúc, không đổi được nữa.
const NEXT_STATUS: Record<string, string[]> = {
  pending: ['confirmed', 'shipping', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao',
  delivered: 'Đã giao', cancelled: 'Đã hủy',
}

// UC-27: đổi trạng thái đơn → set thẳng cột vận đơn trên Order (đã gộp Shipment)
router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body ?? {}
  if (!['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(status)) {
    res.status(400).json({ message: 'Trạng thái không hợp lệ' })
    return
  }

  const existing = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    return
  }

  // Kiểm tra chuyển trạng thái hợp lệ (state machine). Cho phép chọn lại đúng
  // trạng thái hiện tại (no-op) để không báo lỗi khi admin bấm nhầm.
  if (status !== existing.status && !NEXT_STATUS[existing.status].includes(status)) {
    const allowed = NEXT_STATUS[existing.status].map((s) => STATUS_LABEL[s]).join(', ') || 'không có (đơn đã kết thúc)'
    res.status(409).json({
      message: `Không thể chuyển từ "${STATUS_LABEL[existing.status]}" sang "${STATUS_LABEL[status]}". Chỉ được chuyển sang: ${allowed}.`,
    })
    return
  }
  if (status === existing.status) {
    res.json(existing)
    return
  }

  // Gộp thông tin vận đơn thẳng vào Order khi bắt đầu giao / giao xong
  const shipData: Record<string, unknown> = {}
  if (status === 'shipping' && !existing.trackingCode) {
    shipData.shipCarrier = 'GHN Express'
    shipData.trackingCode = `GHN${Math.floor(100000000 + Math.random() * 900000000)}`
    shipData.shippedAt = new Date()
  }
  if (status === 'delivered') shipData.deliveredAt = new Date()

  // Admin hủy đơn → hoàn kho + voucher + đóng thanh toán, gói trong transaction
  const order =
    status === 'cancelled'
      ? await prisma.$transaction(async (tx) => {
          await restoreOrderResources(tx, existing.id)
          return tx.order.update({ where: { id: existing.id }, data: { status } })
        })
      : await prisma.order.update({ where: { id: existing.id }, data: { status, ...shipData } })

  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: `Đơn hàng #${order.id} — cập nhật trạng thái`,
      content: `Trạng thái mới: ${status}`,
      type: 'order',
    },
  })
  res.json(order)
})

/* ---------- UC-25: Sản phẩm ---------- */
router.post('/products', async (req, res) => {
  const { name, categoryId, price, oldPrice, brand, material, description, images = [], variants = [] } = req.body ?? {}
  if (!name || !categoryId || !price) {
    res.status(400).json({ message: 'Thiếu tên, danh mục hoặc giá' })
    return
  }
  // Validate FK trước — tránh lỗi P2003 khó hiểu
  const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } })
  if (!category) {
    res.status(400).json({ message: `Danh mục #${categoryId} không tồn tại` })
    return
  }
  const slug = `${String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
  const product = await prisma.product.create({
    data: {
      name, slug, categoryId: Number(categoryId), price: Number(price), oldPrice: oldPrice ? Number(oldPrice) : null,
      brand: brand ?? 'Hoàng Nha', material: material ?? 'Cotton', description: description ?? '', isNew: true,
      images: { create: (images as string[]).map((url, i) => ({ url, sortOrder: i })) },
      variants: { create: variants },
    },
    include: { images: true, variants: true },
  })
  res.status(201).json(product)
})

router.put('/products/:id', async (req, res) => {
  const { name, categoryId, price, oldPrice, brand, material, description } = req.body ?? {}
  res.json(await prisma.product.update({
    where: { id: Number(req.params.id) },
    data: { name, categoryId: categoryId ? Number(categoryId) : undefined, price: price ? Number(price) : undefined, oldPrice: oldPrice ? Number(oldPrice) : null, brand, material, description },
  }))
})

router.delete('/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: Number(req.params.id) } })
  res.json({ message: 'Đã xóa sản phẩm' })
})

/* ---------- Quản lý biến thể (size × màu) + giá riêng ---------- */

// Danh sách biến thể của một sản phẩm
router.get('/products/:id/variants', async (req, res) => {
  const variants = await prisma.variant.findMany({
    where: { productId: Number(req.params.id) },
    orderBy: [{ color: 'asc' }, { size: 'asc' }],
  })
  res.json(variants)
})

// Thêm biến thể mới. price/oldPrice để trống = dùng chung giá sản phẩm.
router.post('/products/:id/variants', async (req, res) => {
  const { color, colorHex, size, stock, price, oldPrice } = req.body ?? {}
  if (!color || !size) {
    res.status(400).json({ message: 'Thiếu màu hoặc kích cỡ' })
    return
  }
  try {
    const variant = await prisma.variant.create({
      data: {
        productId: Number(req.params.id),
        color: String(color),
        colorHex: colorHex ?? '#111111',
        size: String(size),
        stock: Number(stock ?? 0),
        // Chuỗi rỗng từ form → null, KHÔNG phải 0 (0đ nghĩa là bán miễn phí)
        price: price === '' || price == null ? null : Number(price),
        oldPrice: oldPrice === '' || oldPrice == null ? null : Number(oldPrice),
      },
    })
    res.status(201).json(variant)
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      res.status(409).json({ message: `Biến thể ${color} / ${size} đã tồn tại` })
      return
    }
    throw err
  }
})

// Sửa biến thể — dùng để đổi giá riêng hoặc nhập thêm kho
router.put('/variants/:id', async (req, res) => {
  const { color, colorHex, size, stock, price, oldPrice } = req.body ?? {}
  const id = Number(req.params.id)
  const before = await prisma.variant.findUnique({ where: { id } })
  if (!before) {
    res.status(404).json({ message: 'Không tìm thấy biến thể' })
    return
  }

  const variant = await prisma.variant.update({
    where: { id },
    data: {
      color, colorHex, size,
      stock: stock == null ? undefined : Number(stock),
      price: price === '' || price === null ? null : price === undefined ? undefined : Number(price),
      oldPrice: oldPrice === '' || oldPrice === null ? null : oldPrice === undefined ? undefined : Number(oldPrice),
    },
  })
  res.json(variant)
})

router.delete('/variants/:id', async (req, res) => {
  await prisma.variant.delete({ where: { id: Number(req.params.id) } })
  res.json({ message: 'Đã xóa biến thể' })
})

/* ---------- UC-26: Danh mục ---------- */
router.post('/categories', async (req, res) => {
  const { name, slug, image } = req.body ?? {}
  res.status(201).json(await prisma.category.create({ data: { name, slug, image: image ?? '' } }))
})
router.put('/categories/:id', async (req, res) => {
  const { name, slug, image } = req.body ?? {}
  res.json(await prisma.category.update({ where: { id: Number(req.params.id) }, data: { name, slug, image } }))
})
router.delete('/categories/:id', async (req, res) => {
  await prisma.category.delete({ where: { id: Number(req.params.id) } })
  res.json({ message: 'Đã xóa danh mục' })
})

/* ---------- UC-28: Khách hàng ---------- */
router.get('/customers', async (_req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: {
      id: true, name: true, email: true, avatar: true, createdAt: true,
      orders: { select: { total: true, status: true } },
    },
  })
  res.json(customers.map((c) => ({
    id: c.id, name: c.name, email: c.email, avatar: c.avatar, joined: c.createdAt,
    orderCount: c.orders.length,
    spent: c.orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
  })))
})

/* ---------- UC-29: Voucher ---------- */
router.get('/vouchers', async (_req, res) => {
  res.json(await prisma.voucher.findMany({ orderBy: { id: 'asc' } }))
})
router.post('/vouchers', async (req, res) => {
  const { code, type, value, description, minOrder, expiry, usageLimit } = req.body ?? {}
  res.status(201).json(await prisma.voucher.create({
    data: { code: String(code).toUpperCase(), type, value: Number(value), description: description ?? '', minOrder: Number(minOrder ?? 0), expiry: new Date(expiry), usageLimit: Number(usageLimit ?? 1000) },
  }))
})
router.delete('/vouchers/:id', async (req, res) => {
  await prisma.voucher.delete({ where: { id: Number(req.params.id) } })
  res.json({ message: 'Đã xóa voucher' })
})

/* ---------- UC-30: Banner ---------- */
router.get('/banners', async (_req, res) => {
  res.json(await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } }))
})
router.post('/banners', async (req, res) => {
  const { eyebrow, title, subtitle, image, cta } = req.body ?? {}
  res.status(201).json(await prisma.banner.create({ data: { eyebrow: eyebrow ?? '', title, subtitle: subtitle ?? '', image, cta: cta ?? 'Khám phá ngay' } }))
})
router.put('/banners/:id', async (req, res) => {
  const { eyebrow, title, subtitle, image, cta, active, sortOrder } = req.body ?? {}
  res.json(await prisma.banner.update({ where: { id: Number(req.params.id) }, data: { eyebrow, title, subtitle, image, cta, active, sortOrder } }))
})
router.delete('/banners/:id', async (req, res) => {
  await prisma.banner.delete({ where: { id: Number(req.params.id) } })
  res.json({ message: 'Đã xóa banner' })
})

/* ---------- UC-31: Duyệt đánh giá ---------- */
router.get('/reviews', async (_req, res) => {
  res.json(await prisma.review.findMany({ include: { user: { select: { name: true, avatar: true } }, product: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }))
})
router.patch('/reviews/:id/approve', async (req, res) => {
  const review = await prisma.review.update({ where: { id: Number(req.params.id) }, data: { approved: true } })
  // Cập nhật rating phi chuẩn hóa của sản phẩm
  const agg = await prisma.review.aggregate({
    where: { productId: review.productId, approved: true },
    _avg: { rating: true },
    _count: true,
  })
  await prisma.product.update({
    where: { id: review.productId },
    data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
  })
  res.json(review)
})
router.delete('/reviews/:id', async (req, res) => {
  await prisma.review.delete({ where: { id: Number(req.params.id) } })
  res.json({ message: 'Đã xóa đánh giá' })
})

// UC-41: shop phản hồi đánh giá
router.patch('/reviews/:id/reply', async (req, res) => {
  const { reply } = req.body ?? {}
  if (!reply) {
    res.status(400).json({ message: 'Thiếu nội dung phản hồi' })
    return
  }
  res.json(await prisma.review.update({ where: { id: Number(req.params.id) }, data: { adminReply: reply } }))
})

/* ---------- Đối soát thanh toán SePay ----------
 * Xem mọi giao dịch SePay đã gửi về. matched = false nghĩa là đã nhận tiền
 * nhưng không khớp đơn nào (khách sửa nội dung CK, chuyển thiếu, quá hạn QR,
 * hoặc tiền từ nguồn khác) — cần admin xử lý tay.
 */
router.get('/sepay-logs', async (req, res) => {
  const onlyUnmatched = req.query.unmatched === 'true'
  const logs = await prisma.sepayWebhookLog.findMany({
    where: onlyUnmatched ? { matched: false, transferType: 'in' } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  // BigInt không serialize được sang JSON → phải ép về string
  res.json(logs.map((l) => ({ ...l, transactionId: l.transactionId.toString() })))
})

// Admin xác nhận thủ công một đơn đã nhận tiền (dùng khi khách sửa nội dung CK)
router.post('/orders/:id/confirm-payment', async (req, res) => {
  const { note } = req.body ?? {}
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { payment: true },
  })
  if (!order?.payment) {
    res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    return
  }
  if (order.payment.status === 'paid') {
    res.status(409).json({ message: 'Đơn đã được thanh toán' })
    return
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: order.payment!.id },
      data: { status: 'paid', paidAt: new Date(), transactionCode: `MANUAL${Date.now()}` },
    })
    await tx.order.update({ where: { id: order.id }, data: { status: 'confirmed' } })
    void note
    return tx.notification.create({
      data: {
        userId: order.userId,
        title: `Thanh toán đơn #${order.id} đã được xác nhận`,
        content: 'Đơn hàng của bạn đang được chuẩn bị.',
        type: 'order',
      },
    })
  })
  res.json({ message: 'Đã xác nhận thanh toán', notification: result })
})

export default router
