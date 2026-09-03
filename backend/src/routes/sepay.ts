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
 * nếu không sẽ retry tới 7 lần.
 *
 * Bảng sepay_webhook_logs đã BỎ (theo góp ý ERD) — chống trùng bằng chính
 * trạng thái đơn: updateMany có điều kiện payment_status='pending' nên
 * webhook retry (hoặc 2 request song song) chỉ có đúng 1 lần ăn.
 * ===================================================================== */
router.post('/webhook', async (req, res) => {
  // --- Bước 1: xác thực nguồn gọi ---
  // Endpoint này công khai trên Internet, ai cũng POST vào được.
  // Không kiểm tra là bất kỳ ai cũng "báo" đã thanh toán để nhận hàng free.
  const auth = req.headers.authorization ?? ''
  if (!sepayConfig.apiKey || !safeEqual(auth, `Apikey ${sepayConfig.apiKey}`)) {
    // Log cả trường hợp thiếu SEPAY_API_KEY phía server, vì nhìn từ ngoài
    // hai lỗi này giống hệt nhau (đều 401) nhưng cách sửa khác hẳn:
    // một bên là sai key trên my.sepay.vn, một bên là quên set .env khi deploy.
    // KHÔNG in giá trị header ra log — đó là bí mật, lỡ lộ log là lộ key.
    console.warn('[SePay webhook] 401 Unauthorized', {
      hasServerKey: !!sepayConfig.apiKey,
      hasAuthHeader: !!auth,
    })
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
    // --- Bước 2: chỉ xử lý tiền VÀO và có mã thanh toán ---
    if (transferType !== 'in' || !payCode) {
      // Thiếu payCode là triệu chứng kinh điển của việc mã thanh toán dài quá
      // 10 ký tự đuôi (SePay không tách được trường "code") — in ra content thô
      // để đối chiếu xem tiền tố/độ dài mã có đúng chuẩn không.
      console.log('[SePay webhook] Bỏ qua giao dịch', {
        transactionId,
        transferType,
        payCode,
        amount,
        content: body.content ? String(body.content) : null,
      })
      res.json({ success: true, message: 'Bỏ qua: không phải tiền vào hoặc thiếu mã' })
      return
    }

    // --- Bước 3: khớp đơn hàng + cập nhật trong transaction ---
    const result = await prisma.$transaction<{ ok: boolean; reason: string }>(async (tx) => {
      // pay_code UNIQUE trên orders → tìm thẳng đơn theo mã chuyển khoản
      const order = await tx.order.findUnique({ where: { payCode } })
      if (!order) return { ok: false, reason: 'Không tìm thấy đơn theo mã thanh toán' }
      if (order.paymentStatus === 'paid') return { ok: true, reason: 'Đơn đã thanh toán trước đó' }
      if (order.status === 'cancelled') return { ok: false, reason: 'Đơn đã bị hủy' }

      // Chuyển thiếu tiền → giữ nguyên pending, admin xử lý tay.
      // KHÔNG tự động xác nhận: khách chuyển 10k cho đơn 500k mà được
      // giao hàng thì shop lỗ.
      if (amount < order.total) {
        return { ok: false, reason: `Chuyển thiếu: nhận ${amount}đ / cần ${order.total}đ` }
      }

      // Quá hạn QR → không tự xác nhận (hàng có thể đã bán cho người khác)
      if (order.payExpiresAt && order.payExpiresAt < new Date()) {
        return { ok: false, reason: 'QR đã hết hạn, cần admin đối soát thủ công' }
      }

      // updateMany + điều kiện payment_status='pending': nếu SePay retry hoặc
      // hai webhook chạy song song, chỉ MỘT request đổi được trạng thái,
      // request còn lại count = 0 → đây chính là khóa chống trùng.
      const updated = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: 'pending' },
        data: {
          paymentStatus: 'paid',
          // CHỈ đẩy 'pending' → 'confirmed'. Đơn đã sang "đang chuẩn bị" hay
          // "đang giao" (shop làm trước, tiền về sau) mà gán cứng 'confirmed'
          // là LÙI trạng thái — phá luôn máy trạng thái một chiều.
          ...(order.status === 'pending' && { status: 'confirmed' }),
          paidAt: new Date(),
          transactionCode: body.referenceCode ? String(body.referenceCode) : `SEPAY${transactionId}`,
        },
      })
      if (updated.count === 0) {
        return { ok: true, reason: 'Đơn vừa được xác nhận bởi request khác' }
      }

      await tx.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          title: `Thanh toán thành công #${order.id}`,
          content: `Đã nhận ${amount.toLocaleString('vi-VN')}đ. Đơn hàng đang được chuẩn bị.`,
          type: 'order',
        },
      })
      return { ok: true, reason: 'Đã xác nhận thanh toán' }
    })

    // Log MỌI giao dịch đã xử lý, kể cả thành công: vì luôn trả success:true
    // nên phía SePay không phân biệt được đơn khớp hay không — đây là dấu vết
    // DUY NHẤT còn lại để lần khi khách báo "đã chuyển tiền mà đơn vẫn treo".
    console.log('[SePay webhook]', {
      transactionId,
      payCode,
      amount,
      matched: result.ok,
      reason: result.reason,
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
  })
  if (!order) {
    res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    return
  }
  const expired = !!order.payExpiresAt && order.payExpiresAt < new Date() && order.paymentStatus === 'pending'
  res.json({
    orderId: order.id,
    status: expired ? 'expired' : order.paymentStatus, // pending | paid | expired | failed | refunded
    orderStatus: order.status,
    amount: order.total,
    payCode: order.payCode,
    expiresAt: order.payExpiresAt,
    qrUrl: order.payCode ? buildQrUrl(order.total, order.payCode) : null,
    bank: sepayConfig.bank,
    accountNumber: sepayConfig.accountNumber,
  })
})

export default router
