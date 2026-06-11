import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format";
import type { ProductListItem } from "../types";

export default function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-white transition-all duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#faf9f8]">
        <img
          src={product.main_image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {!!product.is_new && (
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 border border-gray-200 text-[9px] uppercase tracking-widest px-2 py-0.5 font-medium shadow-sm">
              New
            </span>
          )}
          {!!product.is_featured && (
            <span className="bg-gray-900/90 text-white text-[9px] uppercase tracking-widest px-2 py-0.5 font-light shadow-sm">
              Must Have
            </span>
          )}
        </div>
      </div>

      <div className="pt-4 pb-2 text-center px-1">
        <h3 className="text-[11px] uppercase tracking-wider font-light text-gray-900 leading-relaxed truncate group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>

        <p className="mt-1.5 text-[11px] tracking-widest text-[#a3704c] font-medium">
          {formatPrice(product.price)}
        </p>

        {product.sold_count > 0 && (
          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-light mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Đã bán {product.sold_count}
          </p>
        )}
      </div>
    </Link>
  );
}
