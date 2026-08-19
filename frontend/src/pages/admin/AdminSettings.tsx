import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Palette, Truck, Image } from 'lucide-react'
import { PageHeader, Card } from './shared'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useTheme } from '@/context/ThemeContext'
import { useSettings } from '@/context/SettingsContext'
import { adminApi, type ShopSettings } from '@/api/services'
import { apiMessage } from '@/api/error'
import { formatVND } from '@/data'

const TABS = [
  { id: 'website', icon: <Globe size={15} />, label: 'Website' },
  { id: 'shipping', icon: <Truck size={15} />, label: 'Vận chuyển' },
  { id: 'theme', icon: <Palette size={15} />, label: 'Giao diện' },
  { id: 'logo', icon: <Image size={15} />, label: 'Logo' },
]

export default function AdminSettings() {
  const [tab, setTab] = useState('website')
  const [form, setForm] = useState<ShopSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { dark, toggle } = useTheme()
  // reload để Footer / giỏ hàng nhận số mới ngay sau khi lưu, khỏi bắt admin F5
  const { reload } = useSettings()

  useEffect(() => {
    adminApi
      .getSettings()
      .then(setForm)
      .catch((err) => toast(apiMessage(err, 'Không tải được cấu hình'), 'error'))
  }, [toast])

  const setText = (key: keyof ShopSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f))

  // Ô nhập số: giữ chuỗi rỗng khi admin xóa hết, quy về 0 để không thành NaN
  const setNumber = (key: keyof ShopSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [key]: Number(e.target.value.replace(/\D/g, '')) || 0 } : f))

  const save = async () => {
    if (!form) return
    setSaving(true)
    try {
      const saved = await adminApi.updateSettings(form)
      setForm(saved)
      await reload()
      toast('Đã lưu cấu hình')
    } catch (err) {
      toast(apiMessage(err, 'Không lưu được cấu hình'), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return (
      <div>
        <PageHeader title="Cài đặt" subtitle="Cấu hình hệ thống và cửa hàng" />
        <Card className="max-w-2xl p-8">
          <p className="text-sm text-slate-400">Đang tải cấu hình...</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Cài đặt" subtitle="Cấu hình hệ thống và cửa hàng" />

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/60 bg-white p-1.5 dark:border-white/5 dark:bg-zinc-900">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'text-white dark:text-ink' : 'text-slate-500 hover:text-ink dark:hover:text-white'
            }`}
          >
            {tab === t.id && (
              <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-xl bg-ink dark:bg-white" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative flex items-center gap-2">{t.icon} {t.label}</span>
          </button>
        ))}
      </div>

      <Card className="max-w-2xl p-8">
        {tab === 'website' && (
          <div className="space-y-5">
            <FormField label="Tên cửa hàng" value={form.site_name} onChange={setText('site_name')} />
            <FormField label="Slogan" value={form.slogan} onChange={setText('slogan')} />
            <FormField label="Email liên hệ" value={form.contact_email} onChange={setText('contact_email')} />
            <FormField label="Hotline" value={form.hotline} onChange={setText('hotline')} />
            <FormField label="Địa chỉ" value={form.address} onChange={setText('address')} />
            <p className="label-field pt-2 text-slate-500 dark:text-slate-400">Mạng xã hội (để trống thì ẩn icon ở chân trang)</p>
            <FormField label="Facebook" placeholder="https://facebook.com/..." value={form.facebook} onChange={setText('facebook')} />
            <FormField label="Instagram" placeholder="https://instagram.com/..." value={form.instagram} onChange={setText('instagram')} />
            <FormField label="TikTok" placeholder="https://tiktok.com/@..." value={form.tiktok} onChange={setText('tiktok')} />
          </div>
        )}

        {tab === 'shipping' && (
          <div className="space-y-5">
            <p className="rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 dark:bg-white/5 dark:text-slate-400">
              Số tiền nhập ở đây được dùng thật khi khách đặt hàng: backend tính lại phí ship theo
              bảng này, giỏ hàng và trang thanh toán cũng hiển thị theo.
            </p>
            <FormField
              label="Phí giao hàng tiêu chuẩn (đ)"
              inputMode="numeric"
              value={String(form.ship_fee_standard)}
              onChange={setNumber('ship_fee_standard')}
            />
            <FormField
              label="Phí giao hàng hỏa tốc (đ)"
              inputMode="numeric"
              value={String(form.ship_fee_express)}
              onChange={setNumber('ship_fee_express')}
            />
            <FormField
              label="Ngưỡng miễn phí vận chuyển (đ)"
              inputMode="numeric"
              value={String(form.freeship_threshold)}
              onChange={setNumber('freeship_threshold')}
            />
            <p className="text-xs text-slate-400">
              Đơn tiêu chuẩn từ <b>{formatVND(form.freeship_threshold)}</b> sẽ được miễn phí vận chuyển.
            </p>
          </div>
        )}

        {tab === 'theme' && (
          <div className="space-y-7">
            {/* Dark mode là tùy chọn của từng trình duyệt (lưu localStorage),
                không phải cấu hình chung của cửa hàng nên không gửi lên server. */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
              <div>
                <p className="text-sm font-semibold dark:text-white">Chế độ tối (Dark mode)</p>
                <p className="mt-0.5 text-xs text-slate-400">Áp dụng cho trình duyệt này</p>
              </div>
              <button
                onClick={toggle}
                className={`relative h-7 w-13 cursor-pointer rounded-full transition-colors duration-300 ${dark ? 'bg-ink dark:bg-accent' : 'bg-slate-200'}`}
                aria-label="Bật/tắt dark mode"
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${dark ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        {tab === 'logo' && (
          <div className="space-y-6">
            <div>
              <p className="label-field mb-3 text-slate-500 dark:text-slate-400">Logo hiện tại</p>
              <div className="flex h-24 w-52 items-center justify-center gap-3 rounded-2xl bg-ink">
                <img src="/favicon.png" alt="Logo Hoàng Nha" className="h-14 w-14 rounded-full object-cover" />
                <span className="font-display text-2xl font-semibold text-white">{form.site_name}<span className="text-accent">.</span></span>
              </div>
            </div>
            <p className="rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 dark:bg-white/5 dark:text-slate-400">
              Đổi logo bằng cách thay file <code>frontend/public/favicon.png</code>. Nói thật thay vì
              để một nút tải lên bấm vào không có gì xảy ra.
            </p>
          </div>
        )}

        {tab !== 'theme' && tab !== 'logo' && (
          <div className="mt-8 flex justify-end">
            <Button onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
