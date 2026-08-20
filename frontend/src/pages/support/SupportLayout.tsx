import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChevronRight, Headset, Mail, Phone } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import { useSettings } from '@/context/SettingsContext'
import { SUPPORT_NAV } from '@/data/supportNav'

/*
 * Layout dùng chung cho 5 trang Hỗ trợ (route layout — không có path riêng).
 * Tiêu đề + mô tả hero KHÔNG truyền qua props: layout tự tra pathname trong
 * SUPPORT_NAV. Nhờ vậy thêm một trang hỗ trợ mới chỉ cần thêm 1 dòng vào
 * supportNav.ts + 1 route, không phải sửa layout.
 */

export default function SupportLayout() {
  const { pathname } = useLocation()
  const { settings } = useSettings()
  const current = SUPPORT_NAV.find((item) => item.to === pathname)

  return (
    <div className="bg-paper dark:bg-transparent">
      {/* ===== Hero ===== */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-accent/15 blur-[110px]" />
        <div className="relative mx-auto max-w-[1440px] px-4 pt-14 pb-12 sm:px-6 lg:px-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/" className="transition-colors hover:text-accent-dark">
              Trang chủ
            </Link>
            <ChevronRight size={13} />
            <span className="text-slate-600 dark:text-slate-300">{current?.label ?? 'Hỗ trợ'}</span>
          </nav>

          <Reveal direction="up" distance={24}>
            <span className="label-eyebrow mt-6 inline-flex items-center gap-2 text-accent-dark">
              <span className="h-px w-8 bg-accent" />
              Trung tâm hỗ trợ
            </span>
            <h1 className="title-page mt-3 max-w-3xl dark:text-white">{current?.label ?? 'Hỗ trợ khách hàng'}</h1>
            {current && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base dark:text-slate-400">
                {current.desc}
              </p>
            )}
          </Reveal>
        </div>
      </div>

      {/* ===== Nội dung + sidebar ===== */}
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[260px_1fr] lg:gap-16">
          {/* Sidebar: dính khi cuộn trên desktop, cuộn ngang trên mobile */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="label-eyebrow mb-5 text-slate-400">Chủ đề</p>
            <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {SUPPORT_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `shrink-0 rounded-btn px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300 lg:whitespace-normal ${
                      isActive
                        ? 'bg-ink text-white dark:bg-white dark:text-ink'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Hộp liên hệ nhanh */}
            <div className="mt-8 hidden rounded-card border border-slate-200 p-5 lg:block dark:border-white/10">
              <Headset size={20} className="text-accent-dark" />
              <p className="mt-3 text-sm font-semibold dark:text-white">Chưa tìm được câu trả lời?</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Đội ngũ Hoàng Nha hỗ trợ 8:00 – 21:00 mỗi ngày.
              </p>
              <a
                href={`tel:${settings.hotline.replace(/\s/g, '')}`}
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-accent-dark dark:text-white"
              >
                <Phone size={14} className="text-accent-dark" /> {settings.hotline}
              </a>
              <a
                href={`mailto:${settings.contact_email}`}
                className="mt-2 flex items-center gap-2 text-sm break-all text-slate-500 transition-colors hover:text-accent-dark dark:text-slate-400"
              >
                <Mail size={14} className="shrink-0 text-accent-dark" /> {settings.contact_email}
              </a>
            </div>
          </aside>

          {/* Nội dung từng trang */}
          <div className="max-w-3xl space-y-10">
            <Outlet />

            <p className="border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-white/10">
              Cập nhật lần cuối: 19/08/2026 · Nội dung có thể thay đổi, vui lòng xem bản mới nhất tại trang này.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
