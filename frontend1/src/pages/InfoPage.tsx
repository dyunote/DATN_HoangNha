import type { ReactNode } from 'react';
import PageHeader from '../components/PageHeader';

// Khung trang tinh dung chung: tieu de + noi dung dang van ban.
export default function InfoPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow={eyebrow} title={title} />
      <div className="hn-panel p-6 sm:p-8 text-sm leading-relaxed text-ink-soft space-y-4">
        {children}
      </div>
    </div>
  );
}
