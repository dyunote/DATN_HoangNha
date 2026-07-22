import type { Prisma } from '@prisma/client'

/** Kiểu client bên trong prisma.$transaction(async (tx) => ...) */
type Tx = Prisma.TransactionClient

/**
 * Hoàn tác tài nguyên mà việc ĐẶT hàng đã chiếm dụng.
 * Gọi khi hủy đơn (khách tự hủy hoặc admin hủy). PHẢI chạy bên trong
 * transaction — một bước lỗi thì mọi bước trước đó được rollback.
 *
 * Gồm 3 việc:
 *  1. Cộng lại tồn kho từng biến thể + trừ lượt bán
 *  2. Hoàn lượt sử dụng voucher (nếu đơn có dùng)
 *  3. Đóng giao dịch thanh toán (đã trả → refunded, chưa trả → failed)
 */
export async function restoreOrderResources(tx: Tx, orderId: string): Promise<void> {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, payment: true },
  })

  // 1. Hoàn kho + trừ lượt bán
  for (const i of order.items) {
    await tx.variant.updateMany({
      where: { productId: i.productId, color: i.color, size: i.size },
      data: { stock: { increment: i.quantity } },
    })
    // sold >= quantity để không bao giờ âm
    await tx.product.updateMany({
      where: { id: i.productId, sold: { gte: i.quantity } },
      data: { sold: { decrement: i.quantity } },
    })
  }

  // 2. Hoàn lượt voucher — usedCount > 0 để không bao giờ âm
  if (order.voucherId) {
    await tx.voucher.updateMany({
      where: { id: order.voucherId, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    })
  }

  // 3. Đóng giao dịch thanh toán
  if (order.payment) {
    await tx.payment.update({
      where: { id: order.payment.id },
      data: { status: order.payment.status === 'paid' ? 'refunded' : 'failed' },
    })
  }
}
