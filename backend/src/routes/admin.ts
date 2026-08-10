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
    prisma.product.findMany({ take: 6, orderBy: { sold: 'desc' }, include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: true, variants: { select: { stock: true } } } }),
  ])
  // --- Doanh thu 7 tháng gần nhất, tính từ đơn không bị hủy ---
  const since = new Date()
  since.setMonth(since.getMonth() - 6)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const paidOrders = await prisma.order.findMany({
    where: { status: { not: 'cancelled' }, createdAt: { gte: since } },
    select: { total: true, createdAt: true },
  })

  // Dựng sẵn 7 ô tháng rồi cộng dồn — tháng không có đơn vẫn hiện 0 thay vì biến mất
  const buckets: { key: string; name: string; revenue: number; orders: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: `T${d.getMonth() + 1}`, revenue: 0, orders: 0 })
  }
  for (const o of paidOrders) {
    const bucket = buckets.find((b) => b.key === `${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}`)
    if (bucket) {
      bucket.revenue += o.total
      bucket.orders += 1
    }
  }

  // --- Tỉ trọng danh mục theo số lượng đã bán ---
  const categories = await prisma.category.findMany({
    select: { name: true, products: { select: { sold: true } } },
  })
  const categoryShare = categories
    .map((c) => ({ name: c.name, value: c.products.reduce((s, p) => s + p.sold, 0) }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)

  res.json({
    revenue: revenueAgg._sum.total ?? 0,
    orders: orderCount,
    customers: customerCount,
    products: productCount,
    recentOrders,
    bestSellers: bestSellers.map((p) => ({
      id: p.id, name: p.name, price: p.price, sold: p.sold, image: p.images[0]?.url, category: p.category.name,
      // Tồn kho = tổng các biến thể (Product không có cột stock)
      stock: p.variants.reduce((s, v) => s + v.stock, 0),
    })),
    // revenue quy ra triệu đồng cho vừa trục biểu đồ
    revenueByMonth: buckets.map((b) => ({ name: b.name, revenue: Math.round(b.revenue / 1_000_000), orders: b.orders })),
    categoryShare,
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
      orderId: order.id,
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
  const { name, categoryId, price, oldPrice, brand, material, description, images } = req.body ?? {}
  const id = Number(req.params.id)
  // Biến thể (màu × size × tồn kho) sửa qua các endpoint /variants riêng —
  // route này chỉ đụng vào thông tin chung của sản phẩm.
  // Chỉ đụng vào ảnh khi client thực sự gửi mảng images (undefined = giữ nguyên).
  // Cách làm: xóa hết rồi tạo lại theo đúng thứ tự — đơn giản và luôn khớp UI.
  if (Array.isArray(images)) {
    await prisma.productImage.deleteMany({ where: { productId: id } })
    await prisma.productImage.createMany({
      data: (images as string[]).map((url, i) => ({ productId: id, url, sortOrder: i })),
    })
  }
  res.json(await prisma.product.update({
    where: { id },
    data: { name, categoryId: categoryId ? Number(categoryId) : undefined, price: price ? Number(price) : undefined, oldPrice: oldPrice ? Number(oldPrice) : null, brand, material, description },
    include: { images: true },
  }))
})

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Đã xóa sản phẩm' })
  } catch (err) {
    // Sản phẩm đã nằm trong đơn hàng → FK chặn xóa để không phá lịch sử đơn
    if ((err as { code?: string }).code === 'P2003') {
      res.status(409).json({ message: 'Sản phẩm đã có trong đơn hàng nên không xóa được. Hãy ẩn/ngừng bán thay vì xóa.' })
      return
    }
    throw err
  }
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

// Xóa biến thể. Từ khi OrderItem trỏ vào Variant, biến thể ĐÃ TỪNG BÁN không
// xóa được nữa (FK RESTRICT) — xóa đi thì đơn cũ mất dấu vết hàng đã giao.
// Bắt P2003 để trả lời tử tế thay vì ném lỗi 500 khó hiểu.
router.delete('/variants/:id', async (req, res) => {
  try {
    await prisma.variant.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Đã xóa biến thể' })
  } catch (err) {
    if ((err as { code?: string }).code === 'P2003') {
      res.status(409).json({
        message: 'Biến thể này đã có trong đơn hàng nên không xóa được. Hãy đặt tồn kho = 0 để ngừng bán.',
      })
      return
    }
    throw err
  }
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
// Tạo voucher = một chương trình khuyến mãi → BẮN THÔNG BÁO cho toàn bộ khách.
// Trước đây Notification có type 'promo' nhưng không chỗ nào sinh ra, nên
// khách không bao giờ biết shop có mã mới. Gói trong transaction để không
// xảy ra cảnh voucher tạo xong mà thông báo lỗi (hoặc ngược lại).
router.post('/vouchers', async (req, res) => {
  const { code, type, value, description, minOrder, expiry, usageLimit, notify = true } = req.body ?? {}
  const voucher = await prisma.$transaction(async (tx) => {
    const v = await tx.voucher.create({
      data: { code: String(code).toUpperCase(), type, value: Number(value), description: description ?? '', minOrder: Number(minOrder ?? 0), expiry: new Date(expiry), usageLimit: Number(usageLimit ?? 1000) },
    })
    if (notify) {
      const customers = await tx.user.findMany({ where: { role: 'CUSTOMER' }, select: { id: true } })
      const giam =
        v.type === 'percent' ? `giảm ${v.value}%`
        : v.type === 'fixed' ? `giảm ${v.value.toLocaleString('vi-VN')}đ`
        : 'miễn phí vận chuyển'
      // createMany: một câu INSERT nhiều dòng, nhanh hơn hẳn vòng lặp create
      await tx.notification.createMany({
        data: customers.map((c) => ({
          userId: c.id,
          voucherId: v.id, // FK tới voucher → bấm thông báo là áp được mã luôn
          title: `Mã mới ${v.code} — ${giam}`,
          content: `${v.description || `Nhập mã ${v.code} để ${giam}`}. Đơn tối thiểu ${v.minOrder.toLocaleString('vi-VN')}đ, hạn đến ${v.expiry.toLocaleDateString('vi-VN')}.`,
          type: 'promo',
        })),
      })
    }
    return v
  })
  res.status(201).json(voucher)
})
// Sửa voucher. Không bắn thông báo lại: khách đã được báo lúc tạo, sửa mô tả
// hay hạn dùng mà spam thông báo lần nữa là phiền.
router.put('/vouchers/:id', async (req, res) => {
  const { code, type, value, description, minOrder, expiry, usageLimit } = req.body ?? {}
  const voucher = await prisma.voucher.update({
    where: { id: Number(req.params.id) },
    data: {
      ...(code !== undefined && { code: String(code).toUpperCase() }),
      ...(type !== undefined && { type }),
      ...(value !== undefined && { value: Number(value) }),
      ...(description !== undefined && { description }),
      ...(minOrder !== undefined && { minOrder: Number(minOrder) }),
      ...(expiry !== undefined && { expiry: new Date(expiry) }),
      ...(usageLimit !== undefined && { usageLimit: Number(usageLimit) }),
    },
  })
  res.json(voucher)
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
// reviews không còn product_id — tên sản phẩm lấy qua variant.product
router.get('/reviews', async (_req, res) => {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { name: true, avatar: true } },
      variant: { select: { color: true, size: true, product: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  // Giữ nguyên shape cũ cho frontend: thêm field product.name phẳng hóa từ variant
  res.json(reviews.map((r) => ({ ...r, product: { name: r.variant.product.name } })))
})
router.patch('/reviews/:id/approve', async (req, res) => {
  const review = await prisma.review.update({
    where: { id: Number(req.params.id) },
    data: { approved: true },
    include: { variant: { select: { productId: true } } },
  })
  // Cập nhật rating phi chuẩn hóa của sản phẩm — gom mọi review của mọi
  // biến thể thuộc sản phẩm đó (lọc qua quan hệ variant)
  const productId = review.variant.productId
  const agg = await prisma.review.aggregate({
    where: { variant: { productId }, approved: true },
    _avg: { rating: true },
    _count: true,
  })
  await prisma.product.update({
    where: { id: productId },
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

// Admin xác nhận thủ công một đơn đã nhận tiền (dùng khi khách sửa nội dung CK).
// Thanh toán đã GỘP vào orders nên chỉ cần update một bảng.
router.post('/orders/:id/confirm-payment', async (req, res) => {
  const { note } = req.body ?? {}
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) {
    res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    return
  }
  if (order.paymentStatus === 'paid') {
    res.status(409).json({ message: 'Đơn đã được thanh toán' })
    return
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'paid', paidAt: new Date(), transactionCode: `MANUAL${Date.now()}`, status: 'confirmed' },
    })
    void note
    return tx.notification.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        title: `Thanh toán đơn #${order.id} đã được xác nhận`,
        content: 'Đơn hàng của bạn đang được chuẩn bị.',
        type: 'order',
      },
    })
  })
  res.json({ message: 'Đã xác nhận thanh toán', notification: result })
})

export default router
