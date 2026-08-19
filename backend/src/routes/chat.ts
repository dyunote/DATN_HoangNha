// =====================================================================
// Chat AI hỗ trợ khách hàng — POST /api/chat
// Gọi Claude (Anthropic API) kèm dữ liệu thật của shop: danh mục, sản phẩm,
// voucher đang chạy, và đơn hàng gần đây của khách (nếu đã đăng nhập).
// Trả lời stream về frontend theo dạng SSE (text/event-stream).
// =====================================================================
import { Router, type Request, type Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { supportBotReply } from '../lib/supportBot.js'
import type { AuthPayload } from '../lib/auth.js'

const router = Router()

// Đăng nhập là TÙY CHỌN với chat: có token thì biết khách là ai để tra đơn hàng,
// không có (hoặc hết hạn) vẫn chat được như khách vãng lai.
function softAuth(req: Request): AuthPayload | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  try {
    return jwt.verify(header.slice(7), process.env.JWT_SECRET ?? 'dev-secret') as AuthPayload
  } catch {
    return null
  }
}

const money = (n: number) => `${n.toLocaleString('vi-VN')}đ`

const STATUS_VI: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
}

// Phần TĨNH của system prompt — giữ nguyên byte giữa các request để
// prompt caching hoạt động (cache_control đặt ở block này).
const SYSTEM_STATIC = `Bạn là trợ lý ảo của Hoàng Nha Fashion — cửa hàng thời trang trực tuyến tại Việt Nam.

Nhiệm vụ: hỗ trợ khách hàng về sản phẩm, đơn hàng, giao nhận, thanh toán, đổi trả và voucher. Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn, đúng trọng tâm câu hỏi.

Chính sách của shop:
- Vận chuyển: tiêu chuẩn 30.000đ (3-5 ngày làm việc), hỏa tốc 55.000đ (1-2 ngày). MIỄN PHÍ vận chuyển tiêu chuẩn cho đơn từ 500.000đ, hoặc khi dùng voucher freeship.
- Thanh toán: COD (trả tiền khi nhận hàng) hoặc chuyển khoản QR qua ngân hàng (SePay). Mã QR có hiệu lực 15 phút — quá hạn khách đặt lại đơn hoặc chọn COD.
- Hủy đơn: chỉ hủy được khi đơn đang ở trạng thái "Chờ xác nhận", tại trang Tài khoản → Đơn hàng. Đơn đã hủy sẽ được hoàn kho và hoàn lượt dùng voucher.
- Voucher: mỗi khách chỉ dùng mỗi mã 1 lần; mã có điều kiện đơn tối thiểu và hạn sử dụng.
- Đổi trả: trong 7 ngày kể từ khi nhận hàng nếu sản phẩm còn nguyên tem mác, chưa qua sử dụng. Liên hệ hotline để được hướng dẫn.

Quy tắc trả lời:
- Chỉ dựa trên dữ liệu shop cung cấp bên dưới; TUYỆT ĐỐI không bịa tên sản phẩm, giá, tồn kho hay thông tin đơn hàng.
- Khi giới thiệu sản phẩm, có thể kèm đường dẫn dạng /san-pham/{id} để khách bấm xem.
- Nếu khách hỏi về đơn hàng mà chưa đăng nhập, hướng dẫn khách đăng nhập để xem tại Tài khoản → Đơn hàng.
- Câu hỏi ngoài phạm vi cửa hàng: từ chối khéo và kéo về chủ đề mua sắm.
- Trả lời bằng văn bản thuần, KHÔNG dùng markdown (không **đậm**, không bảng, không tiêu đề #). Khi liệt kê thì xuống dòng, mỗi mục bắt đầu bằng "-".
- Vấn đề không tự giải quyết được (khiếu nại, sai sản phẩm, hoàn tiền...): xin lỗi khách và hướng dẫn liên hệ hotline 1900 8686 (8h-21h hằng ngày) hoặc email hello@hoangnha.vn.`

// Gom dữ liệu thật của shop cho Claude — phần ĐỘNG, đặt sau breakpoint cache.
async function buildShopContext(auth: AuthPayload | null): Promise<string> {
  const [categories, products, vouchers] = await Promise.all([
    prisma.category.findMany({ select: { name: true, slug: true } }),
    prisma.product.findMany({
      orderBy: { sold: 'desc' },
      take: 30,
      select: {
        id: true, name: true, price: true, oldPrice: true, brand: true,
        rating: true, sold: true, flashSale: true, isNew: true,
        category: { select: { name: true } },
        variants: { select: { stock: true } },
      },
    }),
    prisma.voucher.findMany({
      where: { expiry: { gt: new Date() } },
      select: { code: true, type: true, value: true, minOrder: true, description: true, expiry: true },
    }),
  ])

  const lines: string[] = []
  lines.push('== DANH MỤC ==')
  lines.push(categories.map((c) => c.name).join(', '))

  lines.push('\n== SẢN PHẨM BÁN CHẠY (tối đa 30) ==')
  for (const p of products) {
    const stock = p.variants.reduce((s, v) => s + v.stock, 0)
    const tags = [p.flashSale && 'flash sale', p.isNew && 'hàng mới'].filter(Boolean).join(', ')
    lines.push(
      `- ${p.name} | ${p.category.name} | ${money(p.price)}${p.oldPrice ? ` (giá gốc ${money(p.oldPrice)})` : ''}` +
        ` | ${p.brand} | ${p.rating.toFixed(1)}★ | đã bán ${p.sold} | tồn kho ${stock}${tags ? ` | ${tags}` : ''} | /san-pham/${p.id}`,
    )
  }

  lines.push('\n== VOUCHER ĐANG CHẠY ==')
  if (vouchers.length === 0) lines.push('(hiện chưa có voucher nào)')
  for (const v of vouchers) {
    const val = v.type === 'percent' ? `giảm ${v.value}%` : v.type === 'fixed' ? `giảm ${money(v.value)}` : 'miễn phí vận chuyển'
    lines.push(`- ${v.code}: ${val}, đơn tối thiểu ${money(v.minOrder)}, HSD ${v.expiry.toLocaleDateString('vi-VN')} — ${v.description}`)
  }

  if (auth) {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        name: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true, status: true, total: true, paymentMethod: true, paymentStatus: true,
            createdAt: true, trackingCode: true, shipCarrier: true,
            items: { select: { name: true, quantity: true, color: true, size: true } },
          },
        },
      },
    })
    if (user) {
      lines.push(`\n== KHÁCH ĐANG CHAT: ${user.name} (đã đăng nhập) ==`)
      lines.push('5 đơn hàng gần nhất:')
      if (user.orders.length === 0) lines.push('(khách chưa có đơn hàng nào)')
      for (const o of user.orders) {
        const items = o.items.map((i) => `${i.name} (${i.color}/${i.size}) x${i.quantity}`).join('; ')
        lines.push(
          `- Đơn ${o.id} ngày ${o.createdAt.toLocaleDateString('vi-VN')}: ${STATUS_VI[o.status] ?? o.status}, ` +
            `tổng ${money(o.total)}, thanh toán ${o.paymentMethod === 'cod' ? 'COD' : 'chuyển khoản QR'} (${o.paymentStatus === 'paid' ? 'đã thanh toán' : o.paymentStatus === 'pending' ? 'chưa thanh toán' : o.paymentStatus})` +
            `${o.trackingCode ? `, mã vận đơn ${o.trackingCode} (${o.shipCarrier ?? ''})` : ''} — gồm: ${items}`,
        )
      }
    }
  } else {
    lines.push('\n== KHÁCH ĐANG CHAT: khách vãng lai (chưa đăng nhập) ==')
  }

  return lines.join('\n')
}

router.post('/', async (req: Request, res: Response) => {
  // Kiểm tra hội thoại client gửi lên: mảng {role, content}, kết thúc bằng lượt user
  const raw = Array.isArray(req.body?.messages) ? req.body.messages : []
  const messages = raw
    .filter(
      (m: unknown): m is { role: 'user' | 'assistant'; content: string } =>
        typeof m === 'object' && m !== null &&
        ['user', 'assistant'].includes((m as { role?: string }).role ?? '') &&
        typeof (m as { content?: unknown }).content === 'string' &&
        (m as { content: string }).content.trim().length > 0,
    )
    .slice(-20) // chỉ giữ 20 lượt gần nhất để tiết kiệm token
    .map((m: { role: 'user' | 'assistant'; content: string }) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }))
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    res.status(400).json({ message: 'Hội thoại không hợp lệ' })
    return
  }

  // CHƯA có ANTHROPIC_API_KEY → chạy bot MIỄN PHÍ theo luật (lib/supportBot.ts).
  // Trả về cùng định dạng SSE nên frontend không cần biết đang chat với bot hay AI;
  // khi nào có key thì tự động nâng cấp sang Claude, không phải sửa gì.
  if (!process.env.ANTHROPIC_API_KEY) {
    const reply = await supportBotReply(messages[messages.length - 1].content, softAuth(req))
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.write(`data: ${JSON.stringify({ text: reply })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
    return
  }

  const shopContext = await buildShopContext(softAuth(req))

  // SSE: mỗi mẩu văn bản là một dòng "data: {json}", kết thúc bằng "data: [DONE]"
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const client = new Anthropic()
  try {
    const stream = client.beta.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 16000,
      // Nếu bộ lọc an toàn từ chối yêu cầu, API tự thử lại trên model dự phòng
      // do Anthropic chọn — khách không nhận câu từ chối vô cớ.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // effort "low": chat hỗ trợ cần phản hồi nhanh; câu hỏi đều trả lời được
      // từ ngữ cảnh cung cấp sẵn nên không cần suy luận sâu.
      output_config: { effort: 'low' },
      system: [
        // Block tĩnh — cache được giữa các request (Opus 5 cache từ 512 token)
        { type: 'text', text: SYSTEM_STATIC, cache_control: { type: 'ephemeral' } },
        // Block động — dữ liệu shop thay đổi theo request, đặt sau breakpoint
        { type: 'text', text: `Dữ liệu hiện tại của shop:\n\n${shopContext}` },
      ],
      messages,
    })

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`)
    })

    const final = await stream.finalMessage()
    if (final.stop_reason === 'refusal') {
      res.write(`data: ${JSON.stringify({ text: 'Xin lỗi, mình không thể hỗ trợ nội dung này. Bạn cần giúp gì về sản phẩm hay đơn hàng không ạ?' })}\n\n`)
    }
    res.write('data: [DONE]\n\n')
  } catch (err) {
    // Header SSE đã gửi → không dùng error middleware được nữa, báo lỗi qua stream
    console.error('Chat AI:', err)
    const message =
      err instanceof Anthropic.AuthenticationError
        ? 'API key không hợp lệ. Kiểm tra lại ANTHROPIC_API_KEY trong backend/.env.'
        : err instanceof Anthropic.RateLimitError
          ? 'Hệ thống chat đang quá tải, bạn thử lại sau ít phút nhé.'
          : 'Có lỗi xảy ra, bạn thử gửi lại tin nhắn nhé.'
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.write('data: [DONE]\n\n')
  }
  res.end()
})

export default router
