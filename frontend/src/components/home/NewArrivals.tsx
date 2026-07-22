import type { Product } from '@/types'
import { useProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/product/ProductCard'
import SectionHeading from '@/components/ui/SectionHeading'

export default function NewArrivals({ onQuickView }: { onQuickView: (p: Product) => void }) {
  const { products } = useProducts()
  const items = products.filter((p) => p.isNew).slice(0, 8)
  return (
    <section className="bg-white py-20 lg:py-28 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="Hàng mới về"
          title="New Arrivals"
          subtitle="Những thiết kế mới nhất vừa cập bến — dẫn đầu xu hướng mùa này."
          align="left"
          link="/danh-muc"
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} onQuickView={onQuickView} />
          ))}
        </div>
      </div>
    </section>
  )
}
