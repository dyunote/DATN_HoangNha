import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signToken, authRequired, type AuthedRequest } from '../lib/auth.js'
import {
  buildAuthorizeUrl,
  exchangeCode,
  fetchProfile,
  isConfigured,
  isProviderName,
  OAuthError,
  providerLabel,
  signState,
  verifyState,
  type OAuthProfile,
  type ProviderName,
} from '../lib/oauth.js'

const router = Router()

const publicUser = (u: {
  id: number; name: string; email: string; phone: string | null; avatar: string | null
  gender: string | null; birthday: string | null; role: string; passwordHash: string | null
}) => ({
  id: u.id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar,
  gender: u.gender, birthday: u.birthday, role: u.role,
  // Tài khoản tạo bằng Google/Facebook chưa có mật khẩu — trang "Đổi mật khẩu"
  // dựa vào cờ này để chuyển thành "Đặt mật khẩu" và bỏ ô mật khẩu cũ.
  hasPassword: u.passwordHash !== null,
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
  if (!user) {
    res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' })
    return
  }
  // passwordHash null = tài khoản sinh ra từ Google/Facebook, chưa từng đặt mật
  // khẩu. Nói thẳng ra thay vì "sai mật khẩu", nếu không khách sẽ ngồi thử lại
  // một mật khẩu chưa bao giờ tồn tại.
  if (user.passwordHash === null) {
    res.status(401).json({
      message: 'Tài khoản này đăng nhập bằng Google/Facebook. Hãy bấm đúng nút mạng xã hội bên dưới.',
    })
    return
  }
  if (!(await bcrypt.compare(password ?? '', user.passwordHash))) {
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

// UC-18: Đổi mật khẩu (hoặc đặt mật khẩu lần đầu cho tài khoản social)
router.put('/me/password', authRequired, async (req: AuthedRequest, res) => {
  const { oldPassword, newPassword } = req.body ?? {}
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) {
    res.status(404).json({ message: 'Không tìm thấy người dùng' })
    return
  }
  // Chưa có mật khẩu (đăng nhập bằng Google/Facebook) → cho ĐẶT LẦN ĐẦU, không
  // đòi mật khẩu cũ. Họ không có cách nào cung cấp được mật khẩu cũ, chặn lại
  // là khoá luôn đường đăng nhập dự phòng khi app Facebook bị treo hoặc khi họ
  // đổi số điện thoại. Không yếu hơn về bảo mật: authRequired đã chứng minh
  // danh tính bằng JWT — đúng bằng mức mà oldPassword chứng minh trong một
  // phiên đã đăng nhập.
  const isFirstTime = user.passwordHash === null
  if (user.passwordHash !== null && !(await bcrypt.compare(oldPassword ?? '', user.passwordHash))) {
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
  res.json({ message: isFirstTime ? 'Đặt mật khẩu thành công' : 'Đổi mật khẩu thành công' })
})

/* ============ OAuth 2.0 — đăng nhập bằng Google / Facebook ============ */

// Bỏ dấu '/' cuối để nối chuỗi không sinh ra '//'
const trimSlash = (url: string) => url.replace(/\/$/, '')
const frontendUrl = () => trimSlash(process.env.FRONTEND_URL ?? 'http://localhost:5173')
const backendUrl = () => trimSlash(process.env.BACKEND_URL ?? 'http://localhost:4000')

/** redirect_uri phải khớp 100% với ô đã khai trên Google/Facebook console. */
const callbackUri = (provider: ProviderName) => `${backendUrl()}/api/auth/oauth/${provider}/callback`

/**
 * Chỉ nhận đường dẫn nội bộ — chặn open redirect.
 * Phải loại cả dấu '/' thứ hai: '//evil.com' trông như đường dẫn tương đối
 * nhưng trình duyệt hiểu là URL sang tên miền khác (protocol-relative URL).
 */
const safeRedirect = (value: unknown): string =>
  typeof value === 'string' && /^\/(?!\/)/.test(value) ? value : '/tai-khoan'

/**
 * Mọi lỗi đều quay về trang đăng nhập kèm mã lỗi, không trả JSON trần: người
 * dùng đang ở giữa một chuỗi redirect của trình duyệt, trả JSON ra thì họ nhìn
 * thấy một trang trắng đầy dấu ngoặc nhọn. Frontend dịch mã sang tiếng Việt.
 */
const failTo = (res: Response, code: string) => res.redirect(`${frontendUrl()}/dang-nhap?error=${code}`)

/**
 * Ba khả năng, theo đúng thứ tự ưu tiên:
 *  1. Đã từng đăng nhập bằng chính tài khoản social đó → dùng lại user cũ.
 *  2. Email trùng với user đã có → LIÊN KẾT vào user đó (ghi googleId /
 *     facebookId), không tạo bản ghi trùng và không báo lỗi. Nhờ vậy khách
 *     từng đăng ký bằng email vẫn vào đúng đơn hàng, địa chỉ cũ của mình.
 *  3. Chưa có gì → tạo user mới + thông báo chào mừng như luồng /register.
 */
async function findOrCreateOAuthUser(provider: ProviderName, profile: OAuthProfile) {
  // Viết tách hai nhánh thay vì dùng khoá động: Prisma cần khoá tĩnh mới suy
  // được kiểu, `{ [field]: value }` sẽ rơi về Record<string, string>.
  const linked =
    provider === 'google'
      ? await prisma.user.findUnique({ where: { googleId: profile.providerId } })
      : await prisma.user.findUnique({ where: { facebookId: profile.providerId } })
  if (linked) return linked

  if (!profile.email) {
    throw new OAuthError(
      'no_email',
      `${providerLabel(provider)} không chia sẻ email của tài khoản này`,
    )
  }

  const idData = provider === 'google' ? { googleId: profile.providerId } : { facebookId: profile.providerId }

  const existed = await prisma.user.findUnique({ where: { email: profile.email } })
  if (existed) {
    return prisma.user.update({
      where: { id: existed.id },
      // Chỉ bổ sung định danh social, và ảnh khi user chưa có ảnh nào — không
      // ghi đè tên/ảnh khách đã tự chỉnh trong trang hồ sơ.
      data: { ...idData, avatar: existed.avatar ?? profile.avatar },
    })
  }

  const user = await prisma.user.create({
    data: {
      name: profile.name,
      email: profile.email,
      ...idData,
      // Để null cho đúng sự thật "chưa có mật khẩu", không đặt mật khẩu ngẫu
      // nhiên — khách tự đặt sau ở trang Đổi mật khẩu nếu muốn.
      passwordHash: null,
      avatar: profile.avatar ?? `https://i.pravatar.cc/160?u=${encodeURIComponent(profile.email)}`,
    },
  })
  await prisma.notification.create({
    data: { userId: user.id, title: 'Chào mừng đến với Hoàng Nha! 🎉', content: 'Dùng mã HOANGNHA15 để được giảm 15% cho đơn hàng đầu tiên.', type: 'promo' },
  })
  return user
}

// Bước 1 — đưa người dùng sang màn hình đồng ý cấp quyền của Google/Facebook
router.get('/oauth/:provider', (req, res) => {
  const provider = req.params.provider
  if (!isProviderName(provider)) {
    res.status(404).json({ message: 'Nhà cung cấp đăng nhập không được hỗ trợ' })
    return
  }
  if (!isConfigured(provider)) {
    // 503 chứ không phải 500: server hoàn toàn khoẻ, chỉ là thiếu cấu hình.
    // Nhờ vậy thiếu key vẫn khởi động được, các tính năng khác chạy bình thường.
    res.status(503).json({
      message: `Chưa cấu hình đăng nhập ${providerLabel(provider)} trên máy chủ. Xem hướng dẫn tại docs/oauth-setup.md.`,
    })
    return
  }
  const state = signState(provider, safeRedirect(req.query.redirect))
  res.redirect(buildAuthorizeUrl(provider, callbackUri(provider), state))
})

// Bước 2 — Google/Facebook gọi ngược về đây kèm ?code & ?state
router.get('/oauth/:provider/callback', async (req, res) => {
  const provider = req.params.provider
  if (!isProviderName(provider)) {
    failTo(res, 'oauth_failed')
    return
  }
  // Người dùng bấm "Huỷ" ở màn hình đồng ý → provider trả ?error=access_denied
  if (typeof req.query.error === 'string') {
    failTo(res, req.query.error === 'access_denied' ? 'access_denied' : 'oauth_failed')
    return
  }
  // Kiểm tra state TRƯỚC khi đụng tới code: sai chữ ký, quá hạn 5 phút, hoặc
  // state của provider này bị đem sang provider kia đều bị chặn tại đây.
  const state = verifyState(typeof req.query.state === 'string' ? req.query.state : undefined)
  if (!state || state.provider !== provider) {
    failTo(res, 'invalid_state')
    return
  }
  const code = typeof req.query.code === 'string' ? req.query.code : ''
  if (!code) {
    failTo(res, 'oauth_failed')
    return
  }

  try {
    const accessToken = await exchangeCode(provider, code, callbackUri(provider))
    const profile = await fetchProfile(provider, accessToken)
    const user = await findOrCreateOAuthUser(provider, profile)

    // Token đi qua fragment (#) chứ không phải query (?): trình duyệt KHÔNG gửi
    // fragment lên server, nên nó không lọt vào access log của proxy, cũng
    // không vào header Referer khi trang tải font/ảnh từ CDN. Trang
    // /auth/callback đọc xong sẽ xoá ngay khỏi thanh địa chỉ.
    const hash = new URLSearchParams({
      token: signToken({ userId: user.id, role: user.role }),
      redirect: state.redirect,
    })
    res.redirect(`${frontendUrl()}/auth/callback#${hash.toString()}`)
  } catch (err) {
    if (err instanceof OAuthError) {
      failTo(res, err.code)
      return
    }
    // Lỗi ngoài dự kiến (mất mạng, MySQL chết): vẫn đưa người dùng về trang
    // đăng nhập thay vì trả JSON giữa chuỗi redirect.
    console.error('[oauth] lỗi không mong đợi:', err)
    failTo(res, 'oauth_failed')
  }
})

export default router
