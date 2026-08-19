import fs from 'node:fs'
import path from 'node:path'

// Cấu hình cửa hàng lưu FILE JSON (backend/data/settings.json) thay vì bảng —
// giữ CSDL đúng 13 bảng như ERD đã nộp. Cấu hình là dữ liệu "một bản duy nhất,
// ít thay đổi, không cần JOIN" nên file + cache trong RAM là đủ; mặc định nằm
// trong code, file chỉ chứa những key admin đã sửa.

export interface ShopSettings {
  // Nhóm website
  site_name: string
  slogan: string
  // Nhóm liên hệ
  contact_email: string
  hotline: string
  address: string
  facebook: string
  instagram: string
  tiktok: string
  // Nhóm vận chuyển — orders.ts đọc các số này khi tính tiền
  ship_fee_standard: number
  ship_fee_express: number
  freeship_threshold: number
}

export const SETTING_DEFAULTS: ShopSettings = {
  site_name: 'Hoàng Nha Fashion',
  slogan: 'Modern Luxury Clothing',
  contact_email: 'hello@hoangnha.vn',
  hotline: '1900 8686',
  address: '86 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  facebook: 'https://facebook.com/hoangnhafashion',
  instagram: 'https://instagram.com/hoangnhafashion',
  tiktok: 'https://tiktok.com/@hoangnhafashion',
  ship_fee_standard: 30_000,
  ship_fee_express: 55_000,
  freeship_threshold: 500_000,
}

// Key an toàn để trả ra API công khai — về sau thêm key nhạy cảm (API key cổng
// thanh toán...) thì KHÔNG đưa vào danh sách này
const PUBLIC_KEYS: (keyof ShopSettings)[] = [
  'site_name', 'slogan', 'contact_email', 'hotline', 'address',
  'facebook', 'instagram', 'tiktok',
  'ship_fee_standard', 'ship_fee_express', 'freeship_threshold',
]

const FILE = path.join(process.cwd(), 'data', 'settings.json')

let cache: ShopSettings | null = null

function load(): ShopSettings {
  if (cache) return cache
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Partial<ShopSettings>
    // Merge lên mặc định: thêm key mới vào code thì file cũ thiếu key vẫn chạy
    cache = { ...SETTING_DEFAULTS, ...raw }
  } catch {
    // File chưa tồn tại (lần đầu) hoặc hỏng → dùng nguyên mặc định
    cache = { ...SETTING_DEFAULTS }
  }
  return cache
}

export const getSettings = (): ShopSettings => load()

export const getPublicSettings = (): Partial<ShopSettings> => {
  const all = load()
  return Object.fromEntries(PUBLIC_KEYS.map((k) => [k, all[k]]))
}

/** Nhận object {key: value} từ admin, chỉ giữ key hợp lệ + đúng kiểu, ghi file. */
export function updateSettings(patch: Record<string, unknown>): ShopSettings {
  const next: Record<string, string | number> = { ...load() }
  for (const key of Object.keys(SETTING_DEFAULTS) as (keyof ShopSettings)[]) {
    if (!(key in patch)) continue
    const value = patch[key]
    if (typeof SETTING_DEFAULTS[key] === 'number') {
      // Trường số (phí ship...): từ chối giá trị âm / không phải số thay vì ghi bừa
      const n = Number(value)
      if (Number.isFinite(n) && n >= 0) next[key] = Math.round(n)
    } else if (typeof value === 'string') {
      next[key] = value.trim()
    }
  }
  const settings = next as unknown as ShopSettings
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(settings, null, 2), 'utf8')
  cache = settings
  return settings
}
