import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, type AuthedRequest } from '../lib/auth.js'
import { sepayConfig, safeEqual, buildQrUrl } from '../lib/sepay.js'

const router = Router()

/* =====================================================================
 * 1. WEBHOOK — SePay gọi vào đây mỗi khi có tiền vào tài khoản
 *
 * KHÔNG có authRequired: người gọi là SePay, không phải người dùng.
 * Xác thực bằng API key trong header Authorization.
 *
 * SePay yêu cầu: trả HTTP 200/201 + body {"success": true} trong 30 giây,
 * nếu không sẽ retry tới 7 lần (giãn cách theo dãy Fibonacci).
 * ===================================================================== */
router.post('/webhook', async (req, res) => {
  // --- Bước 1: xác thực nguồn gọi ---
  // Endpoint này công khai trên Internet, ai cũng POST vào được.
  // Không kiểm tra là bất kỳ ai cũng "báo" đã thanh toán để nhận hàng free.
  const auth = req.headers.authorization ?? ''
  if (!sepayConfig.apiKey || !safeEqual(auth, `Apikey ${sepayConfig.apiKey}`)) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  const body = req.body ?? {}
  const transactionId = Number(body.id)
  const transferType = String(body.transferType ?? '')
  const payCode = body.code ? String(body.code).trim().toUpperCase() : null
  const amount = Math.floor(Number(body.transferAmount ?? 0))

  if (!Number.isFinite(transactionId) || transactionId <= 0) {
    res.status(400).json({ success: false, message: 'Payload thiếu id giao dịch' })
    return
  }

  try {
    // --- Bước 2: chống trùng ---
    // transactionId là UNIQUE. Nếu giao dịch này đã ghi rồi (do SePay retry
    // hoặc gửi lại thủ công) thì create sẽ ném lỗi P2002 → thoát sớm,
    // không xử lý lần hai. Đây là lý do phải để DB làm khóa chứ không
    // dùng "SELECT xem có chưa rồi INSERT" — hai request cùng lúc sẽ lọt cả hai.
    try {
      await prisma.sepayWebhookLog.create({
        data: {
          transactionId: BigInt(transactionId),
          gateway: body.gateway ? String(body.gateway) : null,
          payCode,
          amount,
          transferType,
          referenceCode: body.referenceCode ? String(body.referenceCode) : null,
          rawBody: JSON.stringify(body),
        },
      })
    } catch (err) {
      // P2002 = vi phạm ràng buộc UNIQUE → đã nhận giao dịch này rồi
      if ((err as { code?: string }).code === 'P2002') {
        res.json({ success: true, message: 'Giao dịch đã được xử lý trước đó' })
        return
      }
      throw err
    }

    // --- Bước 3: chỉ xử lý tiền VÀO và có mã thanh toán ---
    if (transferType !== 'in' || !payCode) {
      res.json({ success: true, message: 'Bỏ qua: không phải tiền vào hoặc thiếu mã' })
      return
    }

    // --- Bước 4: khớp đơn hàng + cập nhật trong transaction ---
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { payCode },
        include: { order: true },
      })
      if (!payment) return { matched: false, reason: 'Không tìm thấy đơn theo mã thanh toán' }
      if (payment.status === 'paid') return { matched: true, reason: 'Đơn đã thanh toán trước đó' }
      if (payment.order.status === 'cancelled') return { matched: false, reason: 'Đơn đã bị hủy' }

      // Chuyển thiếu tiền → giữ nguyên pending, admin xử lý tay.
      // KHÔNG tự động xác nhận: khách chuyển 10k cho đơn 500k mà được
      // giao hàng thì shop lỗ.
      if (amount < payment.amount) {
        return { matched: false, reason: `Chuyển thiếu: nhận ${amount}đ / cần ${payment.amount}đ` }
      }

      // Quá hạn QR → không tự xác nhận (hàng có thể đã bán cho người khác)
      if (payment.expiresAt && payment.expiresAt < new Date()) {
        return { matched: false, reason: 'QR đã hết hạn, cần admin đối soát thủ công' }
      }

      // updateMany + điều kiện status='pending': nếu hai webhook chạy song song,
      // chỉ một cái đổi được trạng thái, cái còn lại count = 0
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: 'pending' },
        data: {
          status: 'paid',
          paidAt: new Date(),
          transactionCode: body.referenceCode ? String(body.referenceCode) : `SEPAY${transactionId}`,
        },
      })
      if (updated.count === 0) return { matched: true, reason: 'Đơn vừa được xác nhận bởi request khác' }

      // Đơn chuyển sang "đã xác nhận" + báo cho khách
      await tx.order.update({ where: { id: payment.orderId }, data: { status: 'confirmed' } })
      await tx.notification.create({
        data: {
          userId: payment.order.userId,
          title: `Thanh toán thành công #${payment.orderId}`,
          content: `Đã nhận ${amount.toLocaleString('vi-VN')}đ. Đơn hàng đang được chuẩn bị.`,
          type: 'order',
        },
      })
      return { matched: true, reason: 'Đã xác nhận thanh toán' }
    })

    // Đánh dấu log đã khớp đơn hay chưa — phục vụ đối soát sau này
    await prisma.sepayWebhookLog.update({
      where: { transactionId: BigInt(transactionId) },
      data: { matched: result.matched },
    })

    // Luôn trả success:true kể cả khi không khớp đơn — nếu trả lỗi,
    // SePay sẽ retry 7 lần vô ích cho một giao dịch vốn không thuộc về shop
    // (vd: người thân chuyển tiền vào cùng tài khoản).
    res.json({ success: true, message: result.reason })
  } catch (err) {
    console.error('[SePay webhook]', err)
    // Lỗi thật (mất kết nối DB...) → trả 500 để SePay retry
    res.status(500).json({ success: false, message: 'Lỗi xử lý webhook' })
  }
})

/* =====================================================================
 * 2. TRẠNG THÁI THANH TOÁN — frontend poll 3 giây/lần khi đang hiện QR
 * ===================================================================== */
router.get('/orders/:id/payment-status', authRequired, async (req: AuthedRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.auth!.userId },
    include: { payment: true },
  })
  if (!order || !order.payment) {
    res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    return
  }
  const p = order.payment
  const expired = !!p.expiresAt && p.expiresAt < new Date() && p.status === 'pending'
  res.json({
    orderId: order.id,
    status: expired ? 'expired' : p.status, // pending | paid | expired | failed | refunded
    orderStatus: order.status,
    amount: p.amount,
    payCode: p.payCode,
    expiresAt: p.expiresAt,
    qrUrl: p.payCode ? buildQrUrl(p.amount, p.payCode) : null,
    bank: sepayConfig.bank,
    accountNumber: sepayConfig.accountNumber,
  })
})

/* =====================================================================
 * 3. GIẢ LẬP CHUYỂN KHOẢN — chỉ bật khi SEPAY_ALLOW_SIMULATE=true
 *
 * Dùng để test luồng khi chưa có tài khoản SePay thật hoặc chưa chạy ngrok.
 * TUYỆT ĐỐI không bật ở production: bất kỳ ai cũng tự xác nhận đơn của mình.
 * ===================================================================== */
router.post('/simulate/:id', authRequired, async (req: AuthedRequest, res) => {
  if (!sepayConfig.allowSimulate) {
    res.status(403).json({ message: 'Chức năng giả lập đang tắt' })
    return
  }
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.auth!.userId },
    include: { payment: true },
  })
  if (!order?.payment?.payCode) {
    res.status(404).json({ message: 'Không tìm thấy đơn hoặc đơn không dùng chuyển khoản' })
    return
  }

  // Gọi lại chính webhook ở trên với payload y hệt SePay gửi → test đúng
  // đường đi thật thay vì viết logic riêng cho chế độ giả lập
  const fakePayload = {
    id: Date.now(),
    gateway: sepayConfig.bank,
    transactionDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
    accountNumber: sepayConfig.accountNumber,
    code: order.payment.payCode,
    content: `${order.payment.payCode} thanh toan don hang`,
    transferType: 'in',
    transferAmount: order.payment.amount,
    referenceCode: `SIM${Date.now()}`,
  }
  const response = await fetch(`http://localhost:${process.env.PORT ?? 4000}/api/sepay/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Apikey ${sepayConfig.apiKey}` },
    body: JSON.stringify(fakePayload),
  })
  res.json(await response.json())
})

export default router
