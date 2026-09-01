import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authRequired, type AuthedRequest } from '../lib/auth.js'
import { productInclude, toDto } from './products.js'

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

// cart_items chỉ còn FK variant_id (theo ERD) — product JOIN qua variant.
// Lấy nguyên productInclude của route sản phẩm để trả về ĐÚNG shape Product mà
// frontend đang dùng (đủ colors/sizes/variants), nếu không giỏ đồng bộ từ server
// sẽ thiếu dữ liệu để kiểm tồn kho / đổi size ngay trong giỏ.
const cartInclude = {
  variant: { include: { product: { include: productInclude } } },
} satisfies Prisma.CartItemInclude

/** Đọc toàn bộ giỏ của một user, phẳng hóa sẵn để frontend dùng thẳng */
async function loadCart(userId: number) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: cartInclude,
    orderBy: { id: 'asc' },
  })
  return items.map((i) => ({
    id: i.id,
    quantity: i.quantity,
    variantId: i.variantId,
    productId: i.variant.productId,
    color: i.variant.color,
    size: i.variant.size,
    unitPrice: i.variant.price ?? i.variant.product.price,
    stock: i.variant.stock,
    product: toDto(i.variant.product),
  }))
}

router.get('/cart', async (req: AuthedRequest, res) => {
  res.json(await loadCart(req.auth!.userId))
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

/**
 * GỘP giỏ localStorage (khách vãng lai) vào giỏ DB — gọi đúng lúc đăng nhập.
 *
 * QUY TẮC: cùng một biến thể có ở cả hai bên thì lấy số lượng LỚN HƠN, KHÔNG
 * cộng dồn. Cộng dồn nghe hợp lý nhưng sai trong thực tế: khách đăng xuất rồi
 * đăng nhập lại (hoặc mở thêm tab) sẽ merge lại chính giỏ đó lần nữa và số
 * lượng nhân đôi mỗi lần. Lấy max thì merge bao nhiêu lần kết quả vẫn thế
 * (idempotent) — điều kiện bắt buộc vì frontend có thể retry khi mạng chập chờn.
 *
 * Body: { items: [{ productId, color, size, quantity }] } — hoặc variantId nếu có.
 * Trả về TOÀN BỘ giỏ sau khi gộp để frontend thay thẳng state, khỏi gọi thêm GET.
 */
router.post('/cart/merge', async (req: AuthedRequest, res) => {
  const userId = req.auth!.userId
  const raw = (req.body ?? {}).items
  if (!Array.isArray(raw)) {
    res.status(400).json({ message: 'Thiếu danh sách sản phẩm cần gộp' })
    return
  }

  // Gộp trùng ngay trong payload trước: giỏ local hỏng có thể chứa 2 dòng cùng
  // biến thể, xử lý tuần tự sẽ khiến dòng sau đè dòng trước.
  const wanted = new Map<number, { quantity: number; stock: number }>()
  let skipped = 0
  for (const entry of raw as Record<string, unknown>[]) {
    const variant = await resolveVariant(entry ?? {})
    // Biến thể đã bị xóa / hết hàng thì bỏ qua, KHÔNG làm hỏng cả lần gộp
    if (!variant || variant.stock <= 0) {
      skipped++
      continue
    }
    const qty = Math.max(1, Number(entry?.quantity) || 1)
    const seen = wanted.get(variant.id)
    wanted.set(variant.id, { quantity: Math.max(seen?.quantity ?? 0, qty), stock: variant.stock })
  }

  if (wanted.size > 0) {
    const variantIds = [...wanted.keys()]
    const existing = await prisma.cartItem.findMany({
      where: { userId, variantId: { in: variantIds } },
      select: { variantId: true, quantity: true },
    })
    const inDb = new Map(existing.map((i) => [i.variantId, i.quantity]))

    // Một transaction cho cả lần gộp: đăng nhập ở 2 tab cùng lúc cũng không tạo
    // ra trạng thái nửa vời (một nửa số dòng đã gộp, một nửa chưa).
    await prisma.$transaction(
      [...wanted].map(([variantId, { quantity: local, stock }]) => {
        // max(local, db) rồi kẹp theo tồn kho — giỏ không bao giờ vượt kho
        const quantity = Math.min(Math.max(local, inDb.get(variantId) ?? 0), stock)
        return prisma.cartItem.upsert({
          where: { userId_variantId: { userId, variantId } },
          update: { quantity },
          create: { userId, variantId, quantity },
        })
      }),
    )
  }

  res.json({ items: await loadCart(userId), skipped })
})

/* Hai route dưới thao tác theo BIẾN THỂ chứ không theo id dòng giỏ.
 * Lý do: frontend cập nhật lạc quan (hiện ngay rồi mới gọi API) nên lúc khách
 * sửa số lượng, dòng vừa thêm có thể chưa có id do server trả về. Định danh
 * bằng (productId + color + size) thì client luôn gọi được ngay, không phải
 * chờ id — hết hẳn một lớp race condition.
 * PHẢI khai báo TRƯỚC '/cart/:id', nếu không Express khớp 'item' vào :id.
 */
router.put('/cart/item', async (req: AuthedRequest, res) => {
  const variant = await resolveVariant(req.body ?? {})
  if (!variant) {
    res.status(400).json({ message: 'Không tìm thấy biến thể (màu/size) của sản phẩm' })
    return
  }
  const qty = Math.max(1, Number((req.body ?? {}).quantity) || 1)
  if (qty > variant.stock) {
    res.status(409).json({ message: `Biến thể ${variant.color}/${variant.size} chỉ còn ${variant.stock} sản phẩm` })
    return
  }
  await prisma.cartItem.upsert({
    where: { userId_variantId: { userId: req.auth!.userId, variantId: variant.id } },
    update: { quantity: qty },
    create: { userId: req.auth!.userId, variantId: variant.id, quantity: qty },
  })
  res.json({ message: 'Đã cập nhật', quantity: qty })
})

router.delete('/cart/item', async (req: AuthedRequest, res) => {
  const variant = await resolveVariant(req.body ?? {})
  if (!variant) {
    res.status(400).json({ message: 'Không tìm thấy biến thể (màu/size) của sản phẩm' })
    return
  }
  await prisma.cartItem.deleteMany({ where: { userId: req.auth!.userId, variantId: variant.id } })
  res.json({ message: 'Đã xóa' })
})

/** Xóa sạch giỏ — dùng khi đặt hàng xong hoặc khách bấm "xóa tất cả" */
router.delete('/cart', async (req: AuthedRequest, res) => {
  await prisma.cartItem.deleteMany({ where: { userId: req.auth!.userId } })
  res.json({ message: 'Đã xóa giỏ hàng' })
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

/* ---------- UC-09: Danh sách yêu thích (đồng bộ đa thiết bị) ----------
 * Lưu ở cột JSON `users.wishlist` — mảng product_id. Không tạo bảng mới vì
 * CSDL phải giữ đúng 13 bảng theo ERD (xem prisma/migrate-wishlist.sql).
 * Khách CHƯA đăng nhập vẫn thích được, danh sách nằm ở localStorage rồi gộp
 * lên đây lúc đăng nhập — giống hệt cơ chế của giỏ hàng.
 */

/** Số sản phẩm tối đa một người được thích — chặn payload phình vô hạn */
const WISHLIST_MAX = 200

/** Đọc cột JSON ra mảng số, bỏ mọi thứ không phải id hợp lệ */
function parseWishlist(raw: Prisma.JsonValue | null): number[] {
  if (!Array.isArray(raw)) return []
  const ids = raw.filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0)
  return [...new Set(ids)]
}

/** Lấy id gửi lên từ body, làm sạch y như khi đọc từ DB */
function parseIdsInput(body: unknown): number[] | null {
  const raw = (body as { ids?: unknown } | null)?.ids
  if (!Array.isArray(raw)) return null
  const ids = raw.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0)
  return [...new Set(ids)]
}

/**
 * Bỏ id của sản phẩm đã bị xóa rồi mới lưu/trả về.
 * Không lọc thì danh sách yêu thích cứ phình lên bằng những id chết, và trang
 * "Yêu thích" hiện số đếm không khớp với số thẻ sản phẩm thật sự vẽ ra được.
 */
async function keepExistingProducts(ids: number[]): Promise<number[]> {
  if (ids.length === 0) return []
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } })
  const alive = new Set(rows.map((r) => r.id))
  return ids.filter((id) => alive.has(id))
}

/** Ghi danh sách xuống DB và trả về đúng thứ vừa ghi */
async function saveWishlist(userId: number, ids: number[]): Promise<number[]> {
  const clean = (await keepExistingProducts(ids)).slice(0, WISHLIST_MAX)
  await prisma.user.update({ where: { id: userId }, data: { wishlist: clean } })
  return clean
}

router.get('/wishlist', async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { wishlist: true },
  })
  res.json({ ids: await keepExistingProducts(parseWishlist(user?.wishlist ?? null)) })
})

/** GHI ĐÈ toàn bộ danh sách — dùng cho mỗi lần bấm tim (thích / bỏ thích) */
router.put('/wishlist', async (req: AuthedRequest, res) => {
  const ids = parseIdsInput(req.body)
  if (!ids) {
    res.status(400).json({ message: 'Thiếu danh sách sản phẩm yêu thích' })
    return
  }
  res.json({ ids: await saveWishlist(req.auth!.userId, ids) })
})

/**
 * GỘP danh sách localStorage vào DB lúc đăng nhập — phép HỢP hai bên.
 * Khác giỏ hàng ở chỗ không có số lượng để so, nhưng cùng một tinh thần: gộp
 * bao nhiêu lần cũng ra một kết quả, và không bao giờ làm mất thứ đang có.
 */
router.post('/wishlist/merge', async (req: AuthedRequest, res) => {
  const ids = parseIdsInput(req.body)
  if (!ids) {
    res.status(400).json({ message: 'Thiếu danh sách sản phẩm yêu thích' })
    return
  }
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { wishlist: true },
  })
  const merged = [...new Set([...parseWishlist(user?.wishlist ?? null), ...ids])]
  res.json({ ids: await saveWishlist(req.auth!.userId, merged) })
})

/* ---------- UC-22: Thông báo ---------- */
router.get('/notifications', async (req: AuthedRequest, res) => {
  res.json(await prisma.notification.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: 'desc' } }))
})

router.patch('/notifications/read', async (req: AuthedRequest, res) => {
  await prisma.notification.updateMany({ where: { userId: req.auth!.userId }, data: { read: true } })
  res.json({ message: 'Đã đánh dấu tất cả là đã đọc' })
})

/* ---------- UC-23: Viết đánh giá ----------
 *
 * ĐIỀU KIỆN: user đã đăng nhập VÀ có đơn ở trạng thái GIAO THÀNH CÔNG
 * (delivered) chứa đúng biến thể đó. Mỗi (đơn × biến thể) đánh giá 1 lần.
 *
 * Ẩn form ở giao diện là chưa đủ — ai cũng POST thẳng vào API được, nên
 * toàn bộ điều kiện phải kiểm ở server. Đây mới là hàng rào thật.
 */

/** Trạng thái đơn cho phép đánh giá — khớp lib/orderStatus.ts */
const REVIEWABLE_ORDER_STATUS = 'delivered'

/**
 * Các lượt mua đủ điều kiện đánh giá của một user cho một sản phẩm.
 * Mỗi phần tử = một dòng trong một đơn đã giao thành công.
 */
async function purchaseOptions(userId: number, productId: number) {
  const items = await prisma.orderItem.findMany({
    where: {
      variant: { productId },
      order: { userId, status: REVIEWABLE_ORDER_STATUS },
    },
    include: {
      order: { select: { id: true, deliveredAt: true, createdAt: true } },
      variant: { select: { id: true, color: true, size: true } },
    },
    orderBy: { id: 'desc' },
  })

  // Đã đánh giá lượt mua nào rồi thì đánh dấu — chống spam review cùng một đơn
  const reviewed = await prisma.review.findMany({
    where: { userId, variant: { productId }, orderId: { not: null } },
    select: { orderId: true, variantId: true },
  })
  const reviewedKeys = new Set(reviewed.map((r) => `${r.orderId}|${r.variantId}`))

  return items.map((i) => ({
    orderId: i.orderId,
    variantId: i.variantId,
    color: i.variant.color,
    size: i.variant.size,
    date: (i.order.deliveredAt ?? i.order.createdAt).toISOString(),
    reviewed: reviewedKeys.has(`${i.orderId}|${i.variantId}`),
  }))
}

/**
 * Khách có được đánh giá sản phẩm này không, và đánh giá thay cho lượt mua nào.
 * Frontend gọi để quyết định hiện form hay hiện dòng "chỉ khách đã mua...".
 */
router.get('/reviews/eligibility/:productId', async (req: AuthedRequest, res) => {
  const productId = Number(req.params.productId)
  if (!Number.isInteger(productId)) {
    res.status(400).json({ message: 'Mã sản phẩm không hợp lệ' })
    return
  }
  const options = await purchaseOptions(req.auth!.userId, productId)
  const available = options.filter((o) => !o.reviewed)

  res.json({
    canReview: available.length > 0,
    reason:
      available.length > 0
        ? ''
        : options.length > 0
          ? 'Bạn đã đánh giá sản phẩm này cho tất cả đơn hàng đã mua.'
          : 'Chỉ khách đã mua sản phẩm này mới có thể đánh giá.',
    /** Các lượt mua chưa đánh giá — client cho khách chọn đánh giá cho đơn nào */
    options: available,
    /** Tổng số lượt mua đã giao thành công (kể cả đã đánh giá) */
    purchasedCount: options.length,
  })
})

router.post('/reviews', async (req: AuthedRequest, res) => {
  const { productId, rating, title, content, orderId } = req.body ?? {}
  if (!productId || !rating || !content) {
    res.status(400).json({ message: 'Thiếu thông tin đánh giá' })
    return
  }
  const userId = req.auth!.userId

  // --- Bước 1: khách phải THỰC SỰ đã mua và đã nhận hàng ---
  const options = await purchaseOptions(userId, Number(productId))
  if (options.length === 0) {
    res.status(403).json({ message: 'Chỉ khách đã mua sản phẩm này mới có thể đánh giá.' })
    return
  }

  // --- Bước 2: chốt xem đánh giá cho lượt mua nào ---
  // Client gửi variantId/color+size (biến thể muốn đánh giá) và/hoặc orderId.
  // Không gửi gì thì lấy lượt mua GẦN NHẤT chưa đánh giá.
  const wanted = await resolveVariant(req.body ?? {})
  if (wanted && wanted.productId !== Number(productId)) {
    res.status(400).json({ message: 'Biến thể không thuộc sản phẩm này' })
    return
  }

  const match = options.find(
    (o) =>
      (!orderId || o.orderId === String(orderId)) &&
      (!wanted || o.variantId === wanted.id),
  )
  if (!match) {
    res.status(403).json({
      message: 'Bạn chưa mua phiên bản này, hoặc đơn hàng chưa được giao thành công.',
    })
    return
  }
  if (match.reviewed) {
    res.status(409).json({ message: `Bạn đã đánh giá sản phẩm này trong đơn #${match.orderId} rồi.` })
    return
  }

  // --- Bước 3: ghi đánh giá ---
  // UNIQUE(order_id, variant_id) ở DB là chốt chặn cuối: hai request gửi song
  // song thì chỉ một cái ghi được, cái kia rơi vào P2002 bên dưới.
  try {
    const review = await prisma.review.create({
      data: {
        userId,
        variantId: match.variantId,
        orderId: match.orderId,
        rating: Math.min(5, Math.max(1, Math.round(Number(rating)))),
        title,
        content,
      },
    })
    res.status(201).json(review)
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm này trong đơn hàng đó rồi.' })
      return
    }
    throw err
  }
})

export default router
