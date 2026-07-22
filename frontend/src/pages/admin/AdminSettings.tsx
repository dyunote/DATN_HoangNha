import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Palette, Image, Mail, UploadCloud } from 'lucide-react'
import { PageHeader, Card } from './shared'
import FormField from '@/components/ui/FormField'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useTheme } from '@/context/ThemeContext'

// Cấu hình cửa hàng — lưu ở constants (bản rút gọn không dùng bảng Setting)
const DEFAULTS: Record<string, string> = {
  site_name: 'Hoàng Nha Fashion',
  slogan: 'Modern Luxury Clothing',
  contact_email: 'hello@hoangnha.vn',
  hotline: '1900 8686',
  address: '86 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_user: 'noreply@hoangnha.vn',
  smtp_sender: 'Hoàng Nha Fashion',
}

const TABS = [
  { id: 'website', icon: <Globe size={15} />, label: 'Website' },
  { id: 'theme', icon: <Palette size={15} />, label: 'Giao diện' },
  { id: 'logo', icon: <Image size={15} />, label: 'Logo' },
  { id: 'smtp', icon: <Mail size={15} />, label: 'SMTP' },
]

const SWATCHES = ['#111111', '#D6B98C', '#1E293B', '#6B7250', '#8B6F47', '#EF4444']

export default function AdminSettings() {
  const [tab, setTab] = useState('website')
  const [accent, setAccent] = useState('#D6B98C')
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS)
  const { toast } = useToast()
  const { dark, toggle } = useTheme()

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  const save = () => toast('Đã lưu cấu hình ✓')

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
            <FormField label="Tên cửa hàng" value={values.site_name ?? ''} onChange={set('site_name')} />
            <FormField label="Slogan" value={values.slogan ?? ''} onChange={set('slogan')} />
            <FormField label="Email liên hệ" value={values.contact_email ?? ''} onChange={set('contact_email')} />
            <FormField label="Hotline" value={values.hotline ?? ''} onChange={set('hotline')} />
            <FormField label="Địa chỉ" value={values.address ?? ''} onChange={set('address')} />
          </div>
        )}

        {tab === 'theme' && (
          <div className="space-y-7">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">Màu nhấn (Accent)</p>
              <div className="flex gap-3">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccent(c)}
                    className={`h-10 w-10 cursor-pointer rounded-full border-2 transition-all hover:scale-110 ${accent === c ? 'border-ink ring-2 ring-ink/20 dark:border-white' : 'border-slate-200 dark:border-white/15'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
              <div>
                <p className="text-sm font-semibold dark:text-white">Chế độ tối (Dark mode)</p>
                <p className="mt-0.5 text-xs text-slate-400">Áp dụng cho toàn bộ giao diện</p>
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
              <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">Logo hiện tại</p>
              <div className="flex h-24 w-52 items-center justify-center gap-3 rounded-2xl bg-ink">
                <img src="/favicon.png" alt="Logo Hoàng Nha" className="h-14 w-14 rounded-full object-cover" />
                <span className="font-display text-2xl font-semibold text-white">Hoàng Nha<span className="text-accent">.</span></span>
              </div>
            </div>
            <button className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-card border-2 border-dashed border-slate-300 py-10 text-slate-400 transition-colors hover:border-accent hover:text-accent-dark dark:border-white/15">
              <UploadCloud size={26} />
              <span className="text-sm font-medium">Kéo thả hoặc nhấn để tải logo mới</span>
              <span className="text-xs">SVG, PNG tối đa 1MB</span>
            </button>
          </div>
        )}

        {tab === 'smtp' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="SMTP Host" value={values.smtp_host ?? ''} onChange={set('smtp_host')} />
              <FormField label="Port" value={values.smtp_port ?? ''} onChange={set('smtp_port')} />
            </div>
            <FormField label="Username" value={values.smtp_user ?? ''} onChange={set('smtp_user')} />
            <FormField label="Password" type="password" placeholder="••••••••••" value={values.smtp_password ?? ''} onChange={set('smtp_password')} />
            <FormField label="Tên người gửi" value={values.smtp_sender ?? ''} onChange={set('smtp_sender')} />
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button onClick={save}>Lưu thay đổi</Button>
        </div>
      </Card>
    </div>
  )
}
