import { useState } from 'react'
import { Heart } from 'lucide-react'
import { PRODUCTS } from '@/data'
import type { Product } from '@/types'
import { useWishlist } from '@/context/WishlistContext'
import ProductCard from '@/components/product/ProductCard'
import QuickViewModal from '@/components/product/QuickViewModal'
import EmptyState from '@/components/ui/EmptyState'

export default function WishlistPage() {
  const wishlist = useWishlist()
  const [quickView, setQuickView] = useState<Product | null>(null)
  const items = PRODUCTS.filter((p) => wishlist.ids.includes(p.id))

  return (
    <div>
      <h1 className="font-display text-2xl font-medium dark:text-white">Sản phẩm yêu thích</h1>
      <p className="mt-2 text-sm text-slate-400">{items.length} sản phẩm trong danh sách của bạn.</p>

      {items.length === 0 ? (
        <EmptyState
          icon={<Heart size={30} />}
          title="Chưa có sản phẩm yêu thích"
          description="Nhấn vào biểu tượng trái tim trên sản phẩm để lưu lại những thiết kế bạn yêu thích."
          actionLabel="Khám phá ngay"
          actionTo="/danh-muc"
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-3">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickView} />
          ))}
        </div>
      )}
      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  )
}
