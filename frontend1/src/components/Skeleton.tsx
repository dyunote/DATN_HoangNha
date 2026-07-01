// Khung xuong (skeleton) hieu ung pulse, dung khi dang tai du lieu.
// Tao cam giac trang load nhanh hon so voi chu "Dang tai...".
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-beige/70 rounded ${className}`} />;
}

// Khung cho 1 the san pham (khop layout ProductCard)
export function ProductCardSkeleton() {
  return (
    <div className="bg-white">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="pt-4 pb-2 px-1 flex flex-col items-center gap-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// Luoi nhieu the san pham dang tai
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
