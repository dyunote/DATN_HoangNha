import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { signToken, signResetToken, verifyResetToken, authRequired, type AuthedRequest } from '../lib/auth.js'
import { sendOtpMail } from '../lib/mailer.js'

const router = Router()

const publicUser = (u: { id: number; name: string; email: string; phone: string | null; avatar: string | null; gender: string | null; birthday: string | null; role: string }) => ({
  id: u.id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar,
  gender: u.gender, birthday: u.birthday, role: u.role,
})

// UC-01: Đăng ký
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body ?? {}
  if (!name || !email || !password || String(password).length < 8) {
    res.status(400).json({ message: 'Thiếu thông tin hoặc mật khẩu dưới 8 ký tự' })
    return
  }
  const existed = await prisma.user.findUnique({ where: { email } })
  if (existed) {
    res.status(409).json({ message: 'Email đã được đăng ký' })
    return
  }
  const user = await prisma.user.create({
    data: {
      name, email, phone,
      passwordHash: await bcrypt.hash(password, 10),
      avatar: `https://i.pravatar.cc/160?u=${encodeURIComponent(email)}`,
    },
  })
  await prisma.notification.create({
    data: { userId: user.id, title: 'Chào mừng đến với Hoàng Nha! 🎉', content: 'Dùng mã HOANGNHA15 để được giảm 15% cho đơn hàng đầu tiên.', type: 'promo' },
  })
  res.status(201).json({ token: signToken({ userId: user.id, role: user.role }), user: publicUser(user) })
})

// UC-02: Đăng nhập
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  const user = await prisma.user.findUnique({ where: { email: email ?? '' } })
  if (!user || !(await bcrypt.compare(password ?? '', user.passwordHash))) {
    res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' })
    return
  }
  res.json({ token: signToken({ userId: user.id, role: user.role }), user: publicUser(user) })
})

// Lấy thông tin phiên hiện tại
router.get('/me', authRequired, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) {
    res.status(404).json({ message: 'Không tìm thấy người dùng' })
    return
  }
  res.json({ user: publicUser(user) })
})

// UC-17: Cập nhật hồ sơ
router.put('/me', authRequired, async (req: AuthedRequest, res) => {
  const { name, phone, gender, birthday, avatar } = req.body ?? {}
  const user = await prisma.user.update({
    where: { id: req.auth!.userId },
    data: { name, phone, gender, birthday, avatar },
  })
  res.json({ user: publicUser(user) })
})

// UC-18: Đổi mật khẩu
router.put('/me/password', authRequired, async (req: AuthedRequest, res) => {
  const { oldPassword, newPassword } = req.body ?? {}
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user || !(await bcrypt.compare(oldPassword ?? '', user.passwordHash))) {
    res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' })
    return
  }
  if (!newPassword || String(newPassword).length < 8) {
    res.status(400).json({ message: 'Mật khẩu mới tối thiểu 8 ký tự' })
    return
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  })
  res.json({ message: 'Đổi mật khẩu thành công' })
})

/* ============ UC: Quên mật khẩu (3 bước) ============ */

const OTP_TTL_MS = 5 * 60 * 1000 // OTP sống 5 phút
const OTP_RESEND_COOLDOWN_MS = 60 * 1000 // mỗi email tối đa 1 mã / 60 giây
const OTP_MAX_ATTEMPTS = 5 // sai quá 5 lần → vô hiệu mã

// OTP lưu BỘ NHỚ thay vì bảng riêng — giữ CSDL đúng 13 bảng như ERD đã nộp.
// Đánh đổi chấp nhận được: OTP vốn chỉ sống 5 phút, restart backend làm mất mã
// thì khách bấm "Gửi lại" là xong; vẫn chỉ lưu BẢN BĂM bcrypt chứ không lưu mã thô.
// Mỗi user chỉ giữ 1 bản ghi (Map theo userId) — sinh mã mới tự đè mã cũ.
interface OtpRecord {
  id: number // định danh nhét vào resetToken — đổi mã là token cũ vô hiệu
  otpHash: string
  expiresAt: number
  usedAt: number | null
  attempts: number
  createdAt: number
}
const otpStore = new Map<number, OtpRecord>()
let otpSeq = 0

// Bước 1: nhận email → sinh OTP, gửi mail.
// LUÔN trả 200 kể cả email không tồn tại — nếu trả lỗi khác nhau, kẻ xấu
// dò được email nào đã đăng ký (user enumeration).
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body ?? {}
  if (!email || !/^\S+@\S+\.\S+$/.test(String(email))) {
    res.status(400).json({ message: 'Email không hợp lệ' })
    return
  }
  const okMessage = 'Nếu email đã đăng ký, mã xác thực sẽ được gửi tới hộp thư của bạn.'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.json({ message: okMessage })
    return
  }

  // Chống spam: còn mã sinh trong vòng 60s thì từ chối gửi tiếp
  const existing = otpStore.get(user.id)
  if (existing && Date.now() - existing.createdAt < OTP_RESEND_COOLDOWN_MS) {
    res.status(429).json({ message: 'Vui lòng chờ 60 giây trước khi yêu cầu mã mới' })
    return
  }

  // randomInt thay vì Math.random: nguồn ngẫu nhiên mật mã học, không đoán được seed
  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  // Ghi đè bản ghi cũ — tại một thời điểm mỗi user chỉ có 1 mã hiệu lực
  otpStore.set(user.id, {
    id: ++otpSeq,
    otpHash: await bcrypt.hash(otp, 10),
    expiresAt: Date.now() + OTP_TTL_MS,
    usedAt: null,
    attempts: 0,
    createdAt: Date.now(),
  })
  await sendOtpMail(user.email, otp)
  res.json({ message: okMessage })
})

// Bước 2: kiểm OTP → trả resetToken ngắn hạn (10 phút, scope 'reset')
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body ?? {}
  if (!email || !otp || !/^\d{6}$/.test(String(otp))) {
    res.status(400).json({ message: 'Thiếu email hoặc mã OTP không đúng định dạng' })
    return
  }
  const user = await prisma.user.findUnique({ where: { email } })
  const reset = user ? otpStore.get(user.id) : undefined
  if (!user || !reset || reset.usedAt || reset.expiresAt < Date.now() || reset.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(400).json({ message: 'Mã đã hết hạn hoặc không tồn tại, vui lòng yêu cầu mã mới' })
    return
  }
  if (!(await bcrypt.compare(String(otp), reset.otpHash))) {
    // Tăng attempts NGAY khi sai — lần sai thứ 5 sẽ khóa mã ở lượt kiểm tra sau
    reset.attempts += 1
    const left = OTP_MAX_ATTEMPTS - reset.attempts
    res.status(400).json({
      message: left > 0 ? `Mã không đúng, còn ${left} lần thử` : 'Sai quá 5 lần, mã đã bị vô hiệu — vui lòng yêu cầu mã mới',
    })
    return
  }
  res.json({ resetToken: signResetToken(user.id, reset.id) })
})

// Bước 3: resetToken + mật khẩu mới → cập nhật password_hash, đánh dấu used_at
router.post('/reset-password', async (req, res) => {
  const { resetToken, password } = req.body ?? {}
  if (!password || String(password).length < 8) {
    res.status(400).json({ message: 'Mật khẩu mới tối thiểu 8 ký tự' })
    return
  }
  const payload = verifyResetToken(String(resetToken ?? ''))
  if (!payload) {
    res.status(401).json({ message: 'Phiên đặt lại mật khẩu đã hết hạn, vui lòng làm lại từ đầu' })
    return
  }
  // Kiểm bản ghi còn hiệu lực: token hợp lệ nhưng mã đã bị dùng (vd. bấm 2 lần)
  // hoặc user đã xin mã mới (id lệch) thì từ chối
  const reset = otpStore.get(payload.userId)
  if (!reset || reset.id !== payload.resetId || reset.usedAt) {
    res.status(401).json({ message: 'Yêu cầu đặt lại mật khẩu không còn hiệu lực' })
    return
  }
  // Đánh dấu đã dùng TRƯỚC khi ghi DB — bấm 2 lần liên tiếp thì lần 2 bị chặn ngay
  reset.usedAt = Date.now()
  await prisma.user.update({
    where: { id: payload.userId },
    data: { passwordHash: await bcrypt.hash(String(password), 10) },
  })
  res.json({ message: 'Đặt lại mật khẩu thành công' })
})

export default router
