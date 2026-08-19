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
  const recent = await prisma.passwordReset.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) } },
  })
  if (recent) {
    res.status(429).json({ message: 'Vui lòng chờ 60 giây trước khi yêu cầu mã mới' })
    return
  }

  // randomInt thay vì Math.random: nguồn ngẫu nhiên mật mã học, không đoán được seed
  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  await prisma.$transaction(async (tx) => {
    // Vô hiệu mọi mã cũ còn treo — tại một thời điểm chỉ 1 mã có hiệu lực
    await tx.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })
    await tx.passwordReset.create({
      data: {
        userId: user.id,
        otpHash: await bcrypt.hash(otp, 10),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    })
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
  const reset = user
    ? await prisma.passwordReset.findFirst({
        where: { userId: user.id, usedAt: null },
        orderBy: { createdAt: 'desc' },
      })
    : null
  if (!user || !reset || reset.expiresAt < new Date() || reset.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(400).json({ message: 'Mã đã hết hạn hoặc không tồn tại, vui lòng yêu cầu mã mới' })
    return
  }
  if (!(await bcrypt.compare(String(otp), reset.otpHash))) {
    // Tăng attempts NGAY khi sai — lần sai thứ 5 sẽ khóa mã ở lượt kiểm tra sau
    const updated = await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { attempts: { increment: 1 } },
    })
    const left = OTP_MAX_ATTEMPTS - updated.attempts
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
  // Kiểm bản ghi còn hiệu lực: token hợp lệ nhưng mã đã bị dùng (vd. bấm 2 lần) thì từ chối
  const reset = await prisma.passwordReset.findUnique({ where: { id: payload.resetId } })
  if (!reset || reset.userId !== payload.userId || reset.usedAt) {
    res.status(401).json({ message: 'Yêu cầu đặt lại mật khẩu không còn hiệu lực' })
    return
  }
  const passwordHash = await bcrypt.hash(String(password), 10)
  // 2 bảng cùng thay đổi (users + password_resets) → gói trong 1 transaction
  await prisma.$transaction([
    prisma.user.update({ where: { id: payload.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ])
  res.json({ message: 'Đặt lại mật khẩu thành công' })
})

export default router
