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
    // order_items không còn cột product_id — lấy productId QUA variant
    // (variants.product_id) để trừ lượt bán của sản phẩm.
    include: { items: { include: { variant: { select: { productId: true } } } } },
  })

  // 1. Hoàn kho + trừ lượt bán
  // Hoàn theo variantId (khóa chính) thay vì dò productId+color+size như trước:
  // nếu admin đổi tên màu "Đen" → "Đen nhám" sau khi khách đặt, cách cũ
  // updateMany không khớp dòng nào → hủy đơn mà kho KHÔNG được cộng lại.
  for (const i of order.items) {
    await tx.variant.update({
      where: { id: i.variantId },
      data: { stock: { increment: i.quantity } },
    })
    // sold >= quantity để không bao giờ âm
    await tx.product.updateMany({
      where: { id: i.variant.productId, sold: { gte: i.quantity } },
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

  // 3. Đóng thanh toán (đã gộp vào orders): đã trả → refunded, chưa trả → failed
  await tx.order.update({
    where: { id: order.id },
    data: { paymentStatus: order.paymentStatus === 'paid' ? 'refunded' : 'failed' },
  })
}
