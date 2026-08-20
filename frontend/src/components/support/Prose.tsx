import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'

/*
 * Các mảnh nội dung dùng chung cho 5 trang Hỗ trợ.
 * Gom vào đây để 5 trang có cùng khoảng cách, cùng cỡ chữ — thay vì mỗi trang
 * tự viết className riêng rồi lệch nhau như phần footer trước đó.
 */

/** Một mục lớn trong trang: có số thứ tự + tiêu đề + nội dung */
export function Section({ id, index, title, children }: { id?: string; index?: number; title: string; children: ReactNode }) {
  return (
    <Reveal direction="up" distance={28}>
      <section id={id} className="scroll-mt-28 border-t border-slate-200 pt-8 first:border-0 first:pt-0 dark:border-white/10">
        <h2 className="title-card flex items-baseline gap-3 dark:text-white">
          {index !== undefined && (
            <span className="label-meta font-semibold text-accent-dark">{String(index).padStart(2, '0')}</span>
          )}
          {title}
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</div>
      </section>
    </Reveal>
  )
}

/** Danh sách gạch đầu dòng có icon tick */
export function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <Check size={16} className="mt-0.5 shrink-0 text-accent-dark" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** Khung ghi chú nổi bật (lưu ý, ngoại lệ...) */
export function Note({ tone = 'accent', children }: { tone?: 'accent' | 'danger'; children: ReactNode }) {
  const styles =
    tone === 'danger'
      ? 'border-danger/30 bg-danger/5 text-danger'
      : 'border-accent/40 bg-accent/10 text-ink dark:text-slate-200'
  return (
    <div className={`rounded-card border px-5 py-4 text-sm leading-relaxed ${styles}`}>{children}</div>
  )
}

/** Bảng đơn giản: hàng đầu là tiêu đề cột */
export function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    // overflow-x-auto để bảng size không vỡ layout trên điện thoại
    <div className="overflow-x-auto rounded-card border border-slate-200 dark:border-white/10">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/5">
            {head.map((h) => (
              <th key={h} className="label-meta px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100 dark:border-white/5">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 ${j === 0 ? 'font-semibold text-ink dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
