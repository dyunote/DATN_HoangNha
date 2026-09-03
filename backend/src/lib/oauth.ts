// ============================================================
// OAuth 2.0 — Authorization Code flow cho Google & Facebook
//
// Vì sao Authorization Code chạy phía server chứ không phải implicit:
//  - `client_secret` không bao giờ rời khỏi backend. Frontend chỉ nhận JWT của
//    chính ứng dụng này, không hề chạm vào credential của Google/Facebook.
//  - `code` dùng được đúng một lần và phải kèm secret mới đổi ra access token,
//    nên có lộ trên thanh địa chỉ cũng không dùng lại được.
//  - Implicit flow (trả token thẳng trên URL) đã bị OAuth 2.1 khai tử.
//
// Gọi HTTP bằng fetch có sẵn của Node >= 20 — không thêm axios/googleapis.
// ============================================================
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { JWT_KEY } from './auth.js'

/** Phiên bản Graph API của Facebook — đổi ở đúng một chỗ khi cần nâng cấp. */
const FB_GRAPH_VERSION = 'v21.0'

export type ProviderName = 'google' | 'facebook'

/** Hồ sơ đã chuẩn hoá — phần còn lại của app không cần biết provider nào. */
export interface OAuthProfile {
  providerId: string
  email: string | null
  name: string
  avatar: string | null
}

/**
 * Lỗi có mã ngắn để route dịch thẳng thành `/dang-nhap?error=<code>`.
 * Người dùng đang ở giữa một chuỗi redirect của trình duyệt, trả JSON trần ra
 * thì họ nhìn thấy một trang trắng đầy dấu ngoặc nhọn.
 */
export class OAuthError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'OAuthError'
  }
}

export const isProviderName = (v: unknown): v is ProviderName => v === 'google' || v === 'facebook'

/* ---------- Helper đọc JSON an toàn (không dùng any) ---------- */

const asRecord = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {}

/** Chuỗi rỗng cũng coi như không có — Facebook hay trả "" thay vì bỏ hẳn trường. */
const asString = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null)

async function readJson(res: Response, what: string): Promise<Record<string, unknown>> {
  const text = await res.text()
  if (!res.ok) {
    // Log nguyên văn để dev dò được (sai secret, sai redirect_uri...), còn
    // người dùng chỉ nhận một mã lỗi chung chung.
    console.error(`[oauth] ${what} lỗi ${res.status}: ${text.slice(0, 500)}`)
    throw new OAuthError('oauth_failed', `Không ${what} được từ nhà cung cấp`)
  }
  try {
    return asRecord(JSON.parse(text) as unknown)
  } catch {
    throw new OAuthError('oauth_failed', `Phản hồi ${what} không phải JSON hợp lệ`)
  }
}

/* ---------- Cấu hình từng provider ---------- */

interface ProviderConfig {
  label: string
  authorizeUrl: string
  tokenUrl: string
  profileUrl: string
  scope: string
  /** Đọc env lúc gọi, không phải lúc import — .env do index.ts nạp trước. */
  clientId: () => string
  clientSecret: () => string
  /** Tham số riêng của từng nhà cung cấp khi dựng URL đồng ý cấp quyền. */
  authorizeExtras: Record<string, string>
  /** Facebook đổi code bằng GET, Google bằng POST form-urlencoded. */
  tokenMethod: 'GET' | 'POST'
  parseProfile: (raw: Record<string, unknown>) => OAuthProfile
}

const env = (key: string): string => process.env[key] ?? ''

const PROVIDERS: Record<ProviderName, ProviderConfig> = {
  google: {
    label: 'Google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: 'openid email profile',
    clientId: () => env('GOOGLE_CLIENT_ID'),
    clientSecret: () => env('GOOGLE_CLIENT_SECRET'),
    // prompt=select_account: máy dùng chung thì cho chọn lại tài khoản, thay vì
    // im lặng đăng nhập bằng tài khoản Google đang mở sẵn trên trình duyệt.
    authorizeExtras: { response_type: 'code', access_type: 'online', prompt: 'select_account' },
    tokenMethod: 'POST',
    parseProfile: (raw) => {
      const providerId = asString(raw.sub)
      if (!providerId) throw new OAuthError('oauth_failed', 'Google không trả về định danh tài khoản')
      // Email chưa xác thực nghĩa là chưa ai chứng minh hòm thư đó là của họ.
      // Nhận vào thì kẻ tấn công chỉ cần tạo một tài khoản mang email của người
      // khác là chiếm được tài khoản đã có, ở bước ghép theo email bên dưới.
      if (raw.email_verified === false) {
        throw new OAuthError('email_unverified', 'Email Google này chưa được xác thực')
      }
      return {
        providerId,
        email: asString(raw.email),
        name: asString(raw.name) ?? 'Người dùng Google',
        avatar: asString(raw.picture),
      }
    },
  },
  facebook: {
    label: 'Facebook',
    authorizeUrl: `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth`,
    tokenUrl: `https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`,
    profileUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture.type(large)',
    scope: 'email,public_profile',
    clientId: () => env('FACEBOOK_APP_ID'),
    clientSecret: () => env('FACEBOOK_APP_SECRET'),
    authorizeExtras: { response_type: 'code' },
    tokenMethod: 'GET',
    parseProfile: (raw) => {
      const providerId = asString(raw.id)
      if (!providerId) throw new OAuthError('oauth_failed', 'Facebook không trả về định danh tài khoản')
      // picture.type(large) -> { picture: { data: { url, is_silhouette } } }
      const pic = asRecord(asRecord(raw.picture).data)
      // is_silhouette = ảnh mặc định hình bóng người, lấy về cũng vô nghĩa.
      const avatar = pic.is_silhouette === true ? null : asString(pic.url)
      return {
        providerId,
        // Có thể null thật: tài khoản đăng ký bằng số điện thoại, hoặc người
        // dùng bỏ tick quyền email ở màn hình đồng ý. Route phải xử lý.
        email: asString(raw.email),
        name: asString(raw.name) ?? 'Người dùng Facebook',
        avatar,
      }
    },
  },
}

export const providerLabel = (name: ProviderName): string => PROVIDERS[name].label

/** Chưa điền client id/secret trong .env thì route trả 503 thay vì lỗi khó hiểu. */
export const isConfigured = (name: ProviderName): boolean => {
  const p = PROVIDERS[name]
  return p.clientId() !== '' && p.clientSecret() !== ''
}

/* ---------- state: chống CSRF đăng nhập ---------- */

export interface OAuthState {
  provider: ProviderName
  nonce: string
  /** Đường dẫn nội bộ người dùng muốn quay lại sau khi đăng nhập xong. */
  redirect: string
}

/**
 * Vì sao BẮT BUỘC có state: không có nó, kẻ tấn công tự lấy `code` từ tài
 * khoản Google CỦA HẮN rồi dụ nạn nhân mở `.../callback?code=<code của hắn>`
 * (một cái link, một thẻ <img> là đủ). Nạn nhân bị đăng nhập vào tài khoản của
 * kẻ tấn công mà không hay biết, và mọi địa chỉ / đơn hàng họ nhập sau đó đều
 * rơi vào tay hắn. Đây là login CSRF.
 *
 * State là JWT hạn 5 phút ký bằng JWT_SECRET, kèm nonce ngẫu nhiên → chỉ luồng
 * do chính server này khởi tạo mới qua được jwt.verify.
 */
export const signState = (provider: ProviderName, redirect: string): string =>
  jwt.sign({ provider, nonce: randomUUID(), redirect } satisfies OAuthState, JWT_KEY, { expiresIn: '5m' })

export function verifyState(token: string | undefined): OAuthState | null {
  if (!token) return null
  try {
    const { provider, nonce, redirect } = asRecord(jwt.verify(token, JWT_KEY) as unknown)
    if (!isProviderName(provider) || typeof nonce !== 'string' || typeof redirect !== 'string') return null
    return { provider, nonce, redirect }
  } catch {
    // Sai chữ ký hoặc đã quá 5 phút
    return null
  }
}

/* ---------- Ba bước của luồng ---------- */

/** URL màn hình đồng ý cấp quyền. `redirectUri` phải khớp 100% với cấu hình trên console. */
export function buildAuthorizeUrl(name: ProviderName, redirectUri: string, state: string): string {
  const p = PROVIDERS[name]
  const url = new URL(p.authorizeUrl)
  url.search = new URLSearchParams({
    client_id: p.clientId(),
    redirect_uri: redirectUri,
    scope: p.scope,
    state,
    ...p.authorizeExtras,
  }).toString()
  return url.toString()
}

/** Đổi `code` lấy access token. redirectUri phải y hệt lúc gọi authorize. */
export async function exchangeCode(name: ProviderName, code: string, redirectUri: string): Promise<string> {
  const p = PROVIDERS[name]
  const params = new URLSearchParams({
    code,
    client_id: p.clientId(),
    client_secret: p.clientSecret(),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const res =
    p.tokenMethod === 'GET'
      ? await fetch(`${p.tokenUrl}?${params.toString()}`)
      : await fetch(p.tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        })

  const accessToken = asString((await readJson(res, 'đổi mã xác thực')).access_token)
  if (!accessToken) throw new OAuthError('oauth_failed', 'Không nhận được access token')
  return accessToken
}

/** Lấy hồ sơ người dùng và chuẩn hoá về OAuthProfile. */
export async function fetchProfile(name: ProviderName, accessToken: string): Promise<OAuthProfile> {
  const p = PROVIDERS[name]
  const res = await fetch(p.profileUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
  return p.parseProfile(await readJson(res, 'lấy thông tin tài khoản'))
}
