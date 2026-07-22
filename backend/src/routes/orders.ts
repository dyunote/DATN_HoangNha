import { Router, type Response, type NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, type AuthedRequest } from '../lib/auth.js'
import { restoreOrderResources } from '../lib/orderActions.js'
import { genPayCode, buildQrUrl, sepayConfig } from '../lib/sepay.js'

const router = Router()

/** Lỗi nghiệp vụ kèm mã HTTP — ném bên trong transaction để Prisma rollback toàn bộ */
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

/**
 * Bọc route async: lỗi nghiệp vụ (ApiError) → trả đúng mã + message,
 * lỗi lạ → chuyển cho error handler ở index.ts.
 * Không có lớp bọc này, một lỗi ném trong async handler sẽ làm crash server
 * (Express 4 không tự bắt lỗi async).
 */
const h =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      await fn(req, res)
    } catch (err) {
      if (err instanceof ApiError) {
        res.status(err.status).json({ message: err.message })
        return
      }
      next(err)
    }
  }

/** Mã đơn: HN-<yymmdd>-<4 ký tự> — có ngày nên dễ tra cứu, xác suất trùng cực thấp */
const genOrderId = () => {
  const d = new Date()
  const ymd =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `HN-${ymd}-${rand}`
}

interface OrderItemInput {
  productId: number
  quantity: number
  color: string
  size: string
}

// =====================================================================
// UC-12: ĐẶT HÀNG
// Nguyên tắc: KHÔNG TIN CLIENT — giá, phí ship, giảm giá đều tính lại
// từ DB. Mọi thao tác ghi (trừ kho, tạo đơn, voucher, điểm) nằm trong
// MỘT transaction: bất kỳ bước nào thất bại → rollback toàn bộ.
// =====================================================================
router.post(
  '/',
  authRequired,
  h(async (req, res) => {
    const {
      items, voucherCode, paymentMethod = 'cod', shippingMethod = 'standard',
      receiverName, receiverPhone, receiverEmail, addressText, note,
    } = req.body ?? {}
    if (!Array.isArray(items) || items.length === 0 || !receiverName || !receiverPhone || !addressText) {
      throw new ApiError(400, 'Thiếu thông tin đơn hàng')
    }
    const userId = req.auth!.userId

    // ---- Bước 1: nạp sản phẩm + biến thể từ DB (nguồn giá duy nhất) ----
    const products = await prisma.product.findMany({
      where: { id: { in: (items as OrderItemInput[]).map((i) => i.productId) } },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, variants: true },
    })

    let subtotal = 0
    const orderItems: {
      productId: number; variantId: number; name: string; price: number
      quantity: number; color: string; size: string; image: string
    }[] = []

    for (const i of items as OrderItemInput[]) {
      const qty = Math.floor(Number(i.quantity))
      if (!Number.isFinite(qty) || qty < 1 || qty > 99) {
        throw new ApiError(400, 'Số lượng không hợp lệ')
      }
      const p = products.find((x) => x.id === i.productId)
      if (!p) throw new ApiError(400, `Sản phẩm #${i.productId} không tồn tại`)

      // FIX BUG CŨ: variant BẮT BUỘC phải tồn tại. Trước đây nếu size/màu
      // không có thì bỏ qua kiểm tra luôn → đặt được hàng "ma", kho không trừ.
      const variant = p.variants.find((v) => v.color === i.color && v.size === i.size)
      if (!variant) {
        throw new ApiError(400, `"${p.name}" không có phiên bản ${i.color}/${i.size}`)
      }
      // Kiểm tra sơ bộ để báo lỗi sớm — kiểm tra CHÍNH THỨC nằm trong
      // transaction bên dưới (chống race condition)
      if (variant.stock < qty) {
        throw new ApiError(409, `"${p.name}" (${i.color}/${i.size}) chỉ còn ${variant.stock} sản phẩm`)
      }

      // GIÁ THEO BIẾN THỂ: size XXL hoặc màu limited có thể đắt hơn.
      // variant.price = null nghĩa là biến thể dùng chung giá sản phẩm.
      // Luôn lấy giá từ DB, không bao giờ tin giá client gửi lên.
      const unitPrice = variant.price ?? p.price

      subtotal += unitPrice * qty
      orderItems.push({
        productId: p.id, variantId: variant.id, name: p.name, price: unitPrice,
        quantity: qty, color: i.color, size: i.size, image: p.images[0]?.url ?? '',
      })
    }

    // ---- Bước 2: kiểm tra voucher (sơ bộ — chốt hạ trong transaction) ----
    let discount = 0
    let voucherIsFreeship = false
    let voucherId: number | undefined
    if (voucherCode) {
      const v = await prisma.voucher.findUnique({ where: { code: String(voucherCode).toUpperCase() } })
      if (!v || v.expiry < new Date()) throw new ApiError(400, 'Voucher không hợp lệ hoặc đã hết hạn')
      if (v.usedCount >= v.usageLimit) throw new ApiError(400, 'Mã đã hết lượt sử dụng')
      if (subtotal < v.minOrder) {
        throw new ApiError(400, `Đơn tối thiểu ${v.minOrder.toLocaleString('vi-VN')}đ để dùng mã này`)
      }
      // "Mỗi khách 1 lần / mã": thay bảng VoucherRedemption bằng truy vấn đơn.
      // Đơn đã hủy không tính (khách được dùng lại mã).
      const already = await prisma.order.findFirst({
        where: { userId, voucherId: v.id, status: { not: 'cancelled' } },
        select: { id: true },
      })
      if (already) throw new ApiError(409, 'Bạn đã sử dụng mã này rồi')
      if (v.type === 'percent') discount = Math.round((subtotal * v.value) / 100)
      else if (v.type === 'fixed') discount = v.value
      else voucherIsFreeship = true // FIX BUG CŨ: freeship trước đây không có tác dụng
      voucherId = v.id
    }

    // ---- Bước 3: phí ship + tổng tiền (server tự tính, bỏ qua số client gửi) ----
    const freeShip = voucherIsFreeship || (subtotal >= 500000 && shippingMethod === 'standard')
    const shippingFee = freeShip ? 0 : shippingMethod === 'express' ? 55000 : 30000
    const total = Math.max(0, subtotal - discount) + shippingFee

    // ---- Bước 4: TRANSACTION — tất cả hoặc không gì cả ----
    // Thanh toán chuyển khoản (qr) → sinh mã thanh toán + hạn 15 phút,
    // SePay sẽ đối chiếu mã này khi nhận được tiền
    const isBankTransfer = paymentMethod === 'qr'
    const payCode = isBankTransfer ? genPayCode() : null
    const expiresAt = isBankTransfer
      ? new Date(Date.now() + sepayConfig.expireMinutes * 60_000)
      : null

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          id: genOrderId(),
          userId, voucherId,
          paymentMethod, shippingMethod, shippingFee, discount, subtotal, total,
          receiverName, receiverPhone, receiverEmail: receiverEmail ?? '', addressText, note,
          items: { create: orderItems.map(({ variantId: _v, ...rest }) => rest) },
          payment: { create: { method: paymentMethod, amount: total, payCode, expiresAt } },
        },
        include: { items: true, payment: true },
      })

      // FIX BUG CŨ (race condition): trừ kho CÓ ĐIỀU KIỆN stock >= qty.
      // MySQL khóa dòng khi UPDATE → hai đơn tranh nhau món cuối thì chỉ
      // một UPDATE khớp điều kiện; đơn kia count = 0 → ném lỗi → rollback.
      // So với cách cũ (đọc stock rồi mới trừ): giữa lúc ĐỌC và lúc TRỪ,
      // đơn khác có thể đã mua mất hàng → kho âm.
      for (const i of orderItems) {
        const updated = await tx.variant.updateMany({
          where: { id: i.variantId, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        })
        if (updated.count === 0) {
          const current = await tx.variant.findUnique({ where: { id: i.variantId } })
          throw new ApiError(409, `"${i.name}" (${i.color}/${i.size}) chỉ còn ${current?.stock ?? 0} sản phẩm`)
        }
        await tx.product.update({ where: { id: i.productId }, data: { sold: { increment: i.quantity } } })
      }

      // Voucher: tăng lượt dùng CÓ ĐIỀU KIỆN (chưa vượt usageLimit) — cùng
      // lý do chống race như tồn kho. Lượt-dùng-theo-khách đã kiểm ở bước 2
      // bằng truy vấn Order, không cần bảng riêng.
      if (voucherId) {
        const v = await tx.voucher.findUniqueOrThrow({ where: { id: voucherId } })
        const used = await tx.voucher.updateMany({
          where: { id: voucherId, usedCount: { lt: v.usageLimit } },
          data: { usedCount: { increment: 1 } },
        })
        if (used.count === 0) throw new ApiError(409, 'Mã giảm giá vừa hết lượt sử dụng')
      }

      await tx.cartItem.deleteMany({ where: { userId } })
      await tx.notification.create({
        data: {
          userId,
          title: `Đặt hàng thành công #${created.id}`,
          content: `Đơn hàng trị giá ${total.toLocaleString('vi-VN')}đ đang chờ xác nhận.`,
          type: 'order',
        },
      })
      return created
    })

    // Trả kèm thông tin QR để frontend hiện màn hình chuyển khoản ngay
    res.status(201).json({
      ...order,
      sepay: payCode
        ? {
            payCode,
            qrUrl: buildQrUrl(total, payCode),
            bank: sepayConfig.bank,
            accountNumber: sepayConfig.accountNumber,
            amount: total,
            expiresAt,
          }
        : null,
    })
  }),
)

// UC-14: Danh sách đơn của tôi
router.get(
  '/',
  authRequired,
  h(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.auth!.userId },
      include: { items: true, payment: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  }),
)

router.get(
  '/:id',
  authRequired,
  h(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.auth!.userId },
      include: { items: true, payment: true },
    })
    if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng')
    res.json(order)
  }),
)

// =====================================================================
// UC-15: HỦY ĐƠN — phải HOÀN TÁC mọi thứ đặt hàng đã làm:
// cộng lại kho, trừ lượt bán, hoàn lượt voucher, đóng thanh toán.
// FIX BUG CŨ: trước đây chỉ đổi status → kho mất hàng vĩnh viễn.
// =====================================================================
router.patch(
  '/:id/cancel',
  authRequired,
  h(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.auth!.userId },
    })
    if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng')
    if (order.status !== 'pending') throw new ApiError(409, 'Chỉ hủy được đơn đang chờ xác nhận')

    const updated = await prisma.$transaction(async (tx) => {
      // Hoàn kho + voucher + thanh toán (logic dùng chung với admin)
      await restoreOrderResources(tx, order.id)
      return tx.order.update({
        where: { id: order.id },
        data: { status: 'cancelled' },
        include: { items: true, payment: true },
      })
    })

    res.json(updated)
  }),
)

export default router
