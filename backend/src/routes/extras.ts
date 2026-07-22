import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, type AuthedRequest } from '../lib/auth.js'
import { sepayConfig } from '../lib/sepay.js'

const router = Router()

/* ---------- Xác nhận thanh toán thủ công (chỉ dùng demo) ----------
 *
 * ⚠ Endpoint này cho khách tự đánh dấu đơn của mình là "đã thanh toán".
 * Chỉ bật khi SEPAY_ALLOW_SIMULATE=true. Thanh toán chuyển khoản thật đi
 * qua /api/sepay/webhook — nơi tiền được ngân hàng xác nhận trước.
 */
router.post('/payments/:orderId/confirm', authRequired, async (req: AuthedRequest, res) => {
  if (!sepayConfig.allowSimulate) {
    res.status(403).json({
      message: 'Xác nhận thanh toán thủ công đã bị tắt. Vui lòng thanh toán qua chuyển khoản QR.',
    })
    return
  }
  const order = await prisma.order.findFirst({
    where: { id: req.params.orderId, userId: req.auth!.userId },
    include: { payment: true },
  })
  if (!order || !order.payment) {
    res.status(404).json({ message: 'Không tìm thấy đơn hàng / giao dịch' })
    return
  }
  if (order.payment.status === 'paid') {
    res.status(409).json({ message: 'Đơn hàng đã được thanh toán' })
    return
  }
  const [payment] = await prisma.$transaction([
    prisma.payment.update({
      where: { orderId: order.id },
      data: { status: 'paid', paidAt: new Date(), transactionCode: `TXN${Date.now()}` },
    }),
    prisma.order.update({ where: { id: order.id }, data: { status: 'confirmed' } }),
  ])
  res.json(payment)
})

export default router
