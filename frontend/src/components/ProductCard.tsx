import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format';
import type { ProductListItem } from '../types';

export default function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={product.main_image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!!product.is_new && (
            <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded">Mới</span>
          )}
          {!!product.is_featured && (
            <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded">Nổi bật</span>
          )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <p className="mt-1 text-base font-semibold text-rose-600">{formatPrice(product.price)}</p>
        {product.sold_count > 0 && (
          <p className="text-xs text-gray-400 mt-1">Đã bán {product.sold_count}</p>
        )}
      </div>
    </Link>
  );
}
