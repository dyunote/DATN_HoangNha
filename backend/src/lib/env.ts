// Nạp biến môi trường từ backend/.env TRƯỚC mọi module khác.
//
// Vì sao cần file riêng: các module như lib/auth.ts đọc process.env ngay lúc
// import. ESM chạy các import theo thứ tự khai báo, nên chỉ cần đặt
// `import './lib/env.js'` lên đầu index.ts là .env chắc chắn đã có mặt.
//
// Dùng process.loadEnvFile() có sẵn của Node (>= 20.12) thay vì thêm gói dotenv.
// Trên hosting thật, biến môi trường thường được khai báo ở bảng điều khiển và
// không có file .env — thiếu file thì bỏ qua, không coi là lỗi.
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env')

if (existsSync(ENV_PATH) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(ENV_PATH)
  } catch (err) {
    console.warn('⚠ Không đọc được backend/.env:', (err as Error).message)
  }
}
