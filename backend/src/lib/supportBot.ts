// =====================================================================
// Bot hỗ trợ MIỄN PHÍ theo luật (rule-based) — chạy khi CHƯA có
// ANTHROPIC_API_KEY. Nhận diện từ khóa trong câu hỏi rồi trả lời từ
// dữ liệu thật trong MySQL: voucher, đơn hàng, sản phẩm, chính sách.
// Không gọi API ngoài → không tốn chi phí nào.
// =====================================================================
import { prisma } from './prisma.js'
import type { AuthPayload } from './auth.js'

const money = (n: number) => `${n.toLocaleString('vi-VN')}đ`

const STATUS_VI: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
}

// Bỏ dấu tiếng Việt + thường hóa để so khớp từ khóa bền vững
// ("Phí Vận Chuyển", "phi van chuyen", "phí vặn chuyện gõ vội" đều khớp)
const strip = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // xóa các dấu thanh/dấu mũ (ký tự tổ hợp)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()

const has = (q: string, ...keys: string[]) => keys.some((k) => q.includes(k))

const CONTACT = 'Cần hỗ trợ thêm, bạn gọi hotline 1900 8686 (8h-21h hằng ngày) hoặc email hello@hoangnha.vn nhé.'

const FALLBACK = `Mình có thể giúp bạn:
- Tra cứu đơn hàng (gõ "đơn hàng của tôi" hoặc mã đơn HN-...)
- Xem voucher đang có (gõ "voucher")
- Gợi ý sản phẩm (gõ tên món bạn tìm, vd "áo khoác", "đầm")
- Phí vận chuyển, thanh toán, hủy đơn, đổi trả

Bạn thử hỏi lại theo một trong các chủ đề trên nhé. ${CONTACT}`

async function voucherReply(): Promise<string> {
  const vouchers = await prisma.voucher.findMany({
    // Chỉ mã ĐANG chạy: đã tới ngày bắt đầu và chưa quá ngày kết thúc
      where: { startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    select: { code: true, type: true, value: true, minOrder: true, endDate: true, description: true },
  })
  if (vouchers.length === 0) return `Hiện shop chưa có voucher nào đang chạy. Bạn theo dõi mục Thông báo để nhận mã mới nhé! ${CONTACT}`
  const lines = vouchers.map((v) => {
    const val = v.type === 'percent' ? `giảm ${v.value}%` : v.type === 'fixed' ? `giảm ${money(v.value)}` : 'miễn phí vận chuyển'
    return `- ${v.code}: ${val}, đơn tối thiểu ${money(v.minOrder)}, HSD ${v.endDate.toLocaleDateString('vi-VN')}`
  })
  return `Shop đang có ${vouchers.length} voucher:\n${lines.join('\n')}\n\nBạn nhập mã ở bước thanh toán để được giảm nhé (mỗi mã dùng 1 lần/khách).`
}

async function orderReply(question: string, auth: AuthPayload | null): Promise<string> {
  if (!auth) {
    return 'Để tra cứu đơn hàng, bạn vui lòng đăng nhập rồi vào Tài khoản → Đơn hàng, hoặc quay lại chat này sau khi đăng nhập để mình tra giúp nhé.'
  }
  // Khách gõ kèm mã đơn (định dạng HN-yymmdd-xxxx) → tra đúng đơn đó
  const codeMatch = question.match(/hn-\d{6}-\w+/i)
  const orders = await prisma.order.findMany({
    where: codeMatch ? { userId: auth.userId, id: { equals: codeMatch[0].toUpperCase() } } : { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
    take: codeMatch ? 1 : 3,
    select: {
      id: true, status: true, total: true, paymentMethod: true, paymentStatus: true,
      createdAt: true, trackingCode: true, shipCarrier: true,
      items: { select: { name: true, quantity: true } },
    },
  })
  if (orders.length === 0) {
    return codeMatch
      ? `Mình không tìm thấy đơn ${codeMatch[0].toUpperCase()} trong tài khoản của bạn. Bạn kiểm tra lại mã đơn nhé. ${CONTACT}`
      : 'Bạn chưa có đơn hàng nào. Ghé Cửa hàng chọn món ưng ý nhé!'
  }
  const lines = orders.map((o) => {
    const items = o.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
    const pay = o.paymentMethod === 'cod' ? 'COD' : o.paymentStatus === 'paid' ? 'QR - đã thanh toán' : 'QR - chưa thanh toán'
    const track = o.trackingCode ? `, mã vận đơn ${o.trackingCode}${o.shipCarrier ? ` (${o.shipCarrier})` : ''}` : ''
    return `- ${o.id} (${o.createdAt.toLocaleDateString('vi-VN')}): ${STATUS_VI[o.status] ?? o.status}, tổng ${money(o.total)}, ${pay}${track}\n  Gồm: ${items}`
  })
  return `${codeMatch ? 'Thông tin đơn của bạn:' : `${orders.length} đơn gần nhất của bạn:`}\n${lines.join('\n')}\n\nXem chi tiết tại Tài khoản → Đơn hàng.`
}

async function productReply(question: string): Promise<string> {
  const products = await prisma.product.findMany({
    select: {
      id: true, name: true, price: true, oldPrice: true, sold: true, rating: true,
      brand: true, category: { select: { name: true } },
    },
  })
  // Chấm điểm: đếm số từ (>=3 ký tự) trong câu hỏi xuất hiện ở tên/danh mục/brand
  const words = strip(question).split(/\s+/).filter((w) => w.length >= 3)
  const scored = products
    .map((p) => {
      const hay = strip(`${p.name} ${p.category.name} ${p.brand}`)
      return { p, score: words.filter((w) => hay.includes(w)).length }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.sold - a.p.sold)

  // Không khớp từ nào → coi như hỏi chung chung, gợi ý top bán chạy
  const picks = (scored.length > 0 ? scored.map((x) => x.p) : [...products].sort((a, b) => b.sold - a.sold)).slice(0, 5)
  if (picks.length === 0) return `Shop đang cập nhật sản phẩm, bạn quay lại sau nhé. ${CONTACT}`

  const lines = picks.map(
    (p) =>
      `- ${p.name} (${p.category.name}): ${money(p.price)}${p.oldPrice ? ` (giá gốc ${money(p.oldPrice)})` : ''}, ${p.rating.toFixed(1)}★, đã bán ${p.sold} — /san-pham/${p.id}`,
  )
  const head = scored.length > 0 ? 'Mình tìm được mấy món hợp với bạn nè:' : 'Mấy món đang bán chạy nhất của shop nè:'
  return `${head}\n${lines.join('\n')}\n\nBấm vào đường dẫn để xem chi tiết màu, size và tồn kho nhé.`
}

/** Trả lời câu hỏi của khách hoàn toàn từ luật + dữ liệu DB (không gọi AI) */
export async function supportBotReply(question: string, auth: AuthPayload | null): Promise<string> {
  const q = strip(question)

  // Thứ tự nhận diện quan trọng: đơn hàng/voucher trước, sản phẩm sau cùng
  if (has(q, 'don hang', 'don cua toi', 'kien hang', 'trang thai don', 'theo doi don', 'ma van don') || /hn-\d{6}/.test(q)) {
    return orderReply(q, auth)
  }
  if (has(q, 'voucher', 'ma giam', 'khuyen mai', 'giam gia', 'coupon')) return voucherReply()
  if (has(q, 'phi ship', 'van chuyen', 'giao hang', 'phi giao', 'ship', 'freeship', 'mien phi giao')) {
    return `Phí vận chuyển của shop:
- Tiêu chuẩn: 30.000đ (3-5 ngày làm việc)
- Hỏa tốc: 55.000đ (1-2 ngày)
- MIỄN PHÍ giao tiêu chuẩn cho đơn từ 500.000đ hoặc khi dùng voucher freeship.`
  }
  if (has(q, 'thanh toan', 'chuyen khoan', 'cod', 'tra tien', 'quet qr', 'ma qr', 'napas')) {
    return `Shop nhận 2 hình thức thanh toán:
- COD: nhận hàng rồi mới trả tiền
- Chuyển khoản QR ngân hàng: quét mã ở bước đặt hàng, mã QR có hiệu lực 15 phút. Quá hạn bạn đặt lại đơn hoặc chọn COD nhé.`
  }
  if (has(q, 'huy don', 'huy dat', 'khong mua nua')) {
    return `Bạn hủy đơn được khi đơn còn ở trạng thái "Chờ xác nhận": vào Tài khoản → Đơn hàng → bấm Hủy đơn. Đơn đã hủy sẽ hoàn kho và hoàn lượt dùng voucher. Với đơn đã xác nhận trở đi, ${CONTACT}`
  }
  if (has(q, 'doi tra', 'doi hang', 'tra hang', 'hoan tien', 'doi size', 'sai size', 'loi san pham')) {
    return `Shop nhận đổi trả trong 7 ngày kể từ khi nhận hàng, với điều kiện sản phẩm còn nguyên tem mác và chưa qua sử dụng. ${CONTACT}`
  }
  if (has(q, 'hotline', 'lien he', 'so dien thoai', 'email', 'dia chi shop', 'cua hang o dau')) {
    return `Thông tin liên hệ của Hoàng Nha Fashion:
- Hotline: 1900 8686 (8h-21h hằng ngày)
- Email: hello@hoangnha.vn
- Địa chỉ: 86 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh`
  }
  if (has(q, 'xin chao', 'hello', 'chao shop', 'chao ban') || q === 'hi' || q === 'chao') {
    return 'Chào bạn! Mình là trợ lý của Hoàng Nha Fashion. Bạn cần tìm sản phẩm, tra đơn hàng hay hỏi về voucher, vận chuyển, đổi trả — cứ nhắn mình nhé!'
  }
  if (has(q, 'san pham', 'ban chay', 'goi y', 'tim', 'mua', 'ao', 'quan', 'dam', 'vay', 'so mi', 'khoac', 'phu kien', 'giay', 'tui')) {
    return productReply(question)
  }
  return FALLBACK
}
