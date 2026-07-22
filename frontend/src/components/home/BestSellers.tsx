import type { Product } from '@/types'
import { useProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/product/ProductCard'
import SectionHeading from '@/components/ui/SectionHeading'

export default function BestSellers({ onQuickView }: { onQuickView: (p: Product) => void }) {
  const { products } = useProducts()
  const items = products.filter((p) => p.isBestSeller).slice(0, 4)
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <SectionHeading
        eyebrow="Best Seller"
        title="Được yêu thích nhất"
        subtitle="Những thiết kế đã chinh phục hàng nghìn khách hàng — chất lượng được kiểm chứng qua thời gian."
        align="left"
        link="/danh-muc"
      />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  )
}
