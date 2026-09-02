export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-2xl ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[3/4] w-full rounded-img" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Khung xương cho BẢNG trong khu quản trị — đặt thẳng vào `<Table>` thay cho
 * danh sách dòng thật khi đang tải.
 *
 * VÌ SAO KHÔNG DÙNG CHỮ "Đang tải…": một dòng chữ không cho biết sắp có bao
 * nhiêu dữ liệu, và khi dữ liệu về thì bảng bung ra đột ngột làm nhảy cả trang.
 * Khung xương giữ đúng chỗ nên bố cục đứng yên.
 *
 * @param cols số cột — phải khớp mảng `head` truyền cho `<Table>`
 */
export function TableRowsSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  // Bề rộng so le cho giống dữ liệu thật, đỡ trông như bảng kẻ ô
  const widths = ['w-24', 'w-16', 'w-32', 'w-20', 'w-28', 'w-14', 'w-20']
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-50 last:border-0 dark:border-white/5">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-6 py-4">
              <Skeleton className={`h-3.5 rounded-md ${widths[(r + c) % widths.length]}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Khung xương cho danh sách thẻ (sổ địa chỉ, voucher, banner…) */
export function CardListSkeleton({ count = 4, className = 'grid gap-5 md:grid-cols-2' }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card bg-white p-6 ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="mt-4 h-4 w-2/3 rounded-md" />
          <Skeleton className="mt-2.5 h-3 w-1/2 rounded-md" />
          <Skeleton className="mt-2.5 h-3 w-5/6 rounded-md" />
        </div>
      ))}
    </div>
  )
}
