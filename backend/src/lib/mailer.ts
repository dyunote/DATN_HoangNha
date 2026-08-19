import nodemailer from 'nodemailer'

// Gửi mail qua Gmail SMTP (App Password). Nếu thiếu SMTP_USER/SMTP_PASS thì
// KHÔNG chết mà in OTP ra console — để demo offline (không mạng / chưa cấu hình)
// luồng quên mật khẩu vẫn chạy trọn vẹn.

const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS

const transporter = SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null

export async function sendOtpMail(to: string, otp: string): Promise<void> {
  if (!transporter) {
    // Cảnh báo rõ ràng để người demo biết vì sao mail không đến hộp thư
    console.warn('⚠️  [mailer] Chưa cấu hình SMTP_USER / SMTP_PASS trong .env — OTP chỉ in ra console:')
    console.warn(`⚠️  [mailer] OTP cho ${to}: ${otp} (hết hạn sau 5 phút)`)
    return
  }
  await transporter.sendMail({
    from: `"Hoàng Nha Fashion" <${SMTP_USER}>`,
    to,
    subject: 'Mã xác thực đặt lại mật khẩu — Hoàng Nha Fashion',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#1a1a1a;margin:0 0 8px">Hoàng Nha Fashion</h2>
        <p style="color:#555">Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu. Mã xác thực của bạn là:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;color:#1a1a1a;margin:16px 0">${otp}</p>
        <p style="color:#555">Mã có hiệu lực trong <b>5 phút</b> và chỉ dùng được 1 lần.</p>
        <p style="color:#999;font-size:13px">Nếu không phải bạn yêu cầu, hãy bỏ qua email này — mật khẩu của bạn vẫn an toàn.</p>
      </div>
    `,
  })
}
