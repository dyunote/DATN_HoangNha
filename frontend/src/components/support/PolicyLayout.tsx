import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Mail, MapPin, Phone } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import { SHOP_CONTACT } from '@/lib/shop'

/* Khung dùng chung cho các trang chính sách / hỗ trợ ở footer.
 * Gom vào một chỗ để 5 trang không phải chép lại phần đầu trang, breadcrumb
 * và khối liên hệ — sửa một lần là cả 5 trang đổi theo. */

/** Một mục nội dung có tiêu đề — dùng bên trong PolicyLayout */
export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal direction="up">
      <section className="border-t border-slate-200 pt-8 first:border-0 first:pt-0 dark:border-white/10">
        <h2 className="title-card mb-4 dark:text-white">{title}</h2>
        <div className="space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</div>
      </section>
    </Reveal>
  )
}

/** Danh sách gạch đầu dòng dùng chung trong các trang chính sách */
export function PolicyList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <ChevronRight size={15} className="mt-0.5 shrink-0 text-accent" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PolicyLayout({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string
  title: string
  lead: string
  children: ReactNode
}) {
  return (
    <div className="pt-16 lg:pt-20">
      {/* Đầu trang */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-paper dark:border-white/10 dark:bg-zinc-950">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
        <div className="relative mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <nav className="mb-5 flex items-center gap-2 text-xs text-slate-400">
            <Link to="/" className="transition-colors hover:text-accent">
              Trang chủ
            </Link>
            <ChevronRight size={13} />
            <span className="text-slate-500 dark:text-slate-300">{title}</span>
          </nav>
          <p className="label-eyebrow mb-3 text-accent">{eyebrow}</p>
          <h1 className="title-page max-w-3xl dark:text-white">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{lead}</p>
        </div>
      </div>

      {/* Nội dung + cột liên hệ */}
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-9">{children}</div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-card border border-slate-200 p-6 dark:border-white/10">
              <p className="label-eyebrow mb-4 text-slate-400">Cần hỗ trợ thêm?</p>
              <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-3">
                  <Phone size={15} className="shrink-0 text-accent" />
                  <span>
                    {SHOP_CONTACT.hotline}
                    <span className="block text-xs text-slate-400">{SHOP_CONTACT.hours}</span>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={15} className="shrink-0 text-accent" /> {SHOP_CONTACT.email}
                </li>
                <li className="flex gap-3">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-accent" /> {SHOP_CONTACT.address}
                </li>
              </ul>
              <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-400 dark:border-white/10">
                Hoặc nhắn cho trợ lý ở góc phải màn hình — hỏi được cả phí ship, tra đơn và voucher đang chạy.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
