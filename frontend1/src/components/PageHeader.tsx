import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Nhãn tiếng Anh nhỏ phía trên (eyebrow) — giống các section ở trang chủ */
  eyebrow?: string;
  /** Tiêu đề chính tiếng Việt */
  title: string;
  /** Mô tả phụ tuỳ chọn dưới tiêu đề */
  subtitle?: string;
  /** Khu vực hành động bên phải (vd nút, bộ lọc) */
  actions?: ReactNode;
  className?: string;
}

/**
 * Tiêu đề trang dùng chung cho toàn bộ storefront, bám theo phong cách
 * editorial của trang chủ: eyebrow camel in hoa + tiêu đề serif.
 */
export default function PageHeader({ eyebrow, title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 mb-8 ${className}`}>
      <div>
        {eyebrow && <p className="hn-eyebrow">{eyebrow}</p>}
        <h1 className="hn-title">{title}</h1>
        {subtitle && <p className="mt-3 text-sm text-ink-soft font-light max-w-xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
