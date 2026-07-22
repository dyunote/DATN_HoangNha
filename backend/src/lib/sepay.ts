import crypto from 'node:crypto'

/**
 * Cấu hình SePay đọc từ .env
 * Đăng ký tài khoản + liên kết ngân hàng tại https://my.sepay.vn
 */
export const sepayConfig = {
  /** Số tài khoản ngân hàng nhận tiền */
  accountNumber: process.env.SEPAY_ACCOUNT ?? '',
  /** Mã ngân hàng, xem danh sách: https://qr.sepay.vn/banks.json (vd: MBBank, Vietcombank) */
  bank: process.env.SEPAY_BANK ?? 'MBBank',
  /** API key tự đặt khi tạo webhook trên my.sepay.vn — SePay gửi kèm mỗi request */
  apiKey: process.env.SEPAY_API_KEY ?? '',
  /** Thời gian giữ QR trước khi hết hạn (phút) */
  expireMinutes: Number(process.env.SEPAY_EXPIRE_MINUTES ?? 15),
  /** Bật nút "giả lập đã chuyển khoản" — CHỈ dùng khi dev */
  allowSimulate: process.env.SEPAY_ALLOW_SIMULATE === 'true',
}

/**
 * Sinh mã thanh toán ghi trong nội dung chuyển khoản.
 * Prefix "HN" giúp lọc webhook theo tiền tố trên my.sepay.vn.
 *
 * Vì sao dùng randomBytes chứ không phải mã đơn hàng hay timestamp:
 * mã này là thứ DUY NHẤT xác định đơn nào được thanh toán. Nếu đoán được
 * (vd: HN001, HN002...), kẻ xấu chuyển 1.000đ kèm mã của đơn người khác
 * là hệ thống có thể ghi nhầm. randomBytes(6) cho 2^48 khả năng.
 */
export const genPayCode = () => `HN${crypto.randomBytes(6).toString('hex').toUpperCase()}`

/**
 * Sinh URL ảnh QR VietQR. App ngân hàng quét sẽ tự điền sẵn
 * số tài khoản, số tiền và nội dung chuyển khoản.
 */
export const buildQrUrl = (amount: number, payCode: string) => {
  const params = new URLSearchParams({
    acc: sepayConfig.accountNumber,
    bank: sepayConfig.bank,
    amount: String(amount),
    des: payCode,
  })
  return `https://qr.sepay.vn/img?${params}`
}

/**
 * So sánh chuỗi kiểu constant-time để chống timing attack.
 * So sánh thường (a === b) dừng ngay ở ký tự khác đầu tiên, kẻ tấn công
 * đo thời gian phản hồi có thể dò ra API key từng ký tự một.
 */
export const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}
