import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signToken, authRequired, type AuthedRequest } from '../lib/auth.js'

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

export default router
