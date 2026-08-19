import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { settingsApi, type ShopSettings } from '@/api/services'

// Cấu hình cửa hàng tải MỘT LẦN khi mở web rồi dùng chung cho Footer, giỏ hàng,
// trang thanh toán. Backend lỗi / chưa chạy thì giữ nguyên giá trị mặc định —
// giao diện không bao giờ trắng hay hiện "undefined".

const FALLBACK: ShopSettings = {
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

interface SettingsCtx {
  settings: ShopSettings
  /** Gọi sau khi admin lưu cấu hình để cả web nhận số mới, khỏi F5 */
  reload: () => Promise<void>
}

const SettingsContext = createContext<SettingsCtx>({ settings: FALLBACK, reload: async () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ShopSettings>(FALLBACK)

  const reload = async () => {
    try {
      const data = await settingsApi.get()
      // Merge lên FALLBACK: backend cũ thiếu key nào thì vẫn có giá trị mặc định
      setSettings({ ...FALLBACK, ...data })
    } catch {
      // Im lặng dùng mặc định — cấu hình không tải được không phải lỗi chặn người dùng
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  return <SettingsContext.Provider value={{ settings, reload }}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
