import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format";
import type { ProductListItem } from "../types";

export default function ProductCard({ product }: { product: ProductListItem }) {
  // total_stock = tổng tồn kho của tất cả biến thể (size/màu) do backend tính sẵn.
  // <= 0 nghĩa là hết hàng. undefined = API không trả về -> coi như còn hàng để tránh báo nhầm.
  const outOfStock = product.total_stock != null && product.total_stock <= 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-white transition-all duration-300"
      aria-label={outOfStock ? `${product.name} - Hết hàng` : `Xem nhanh ${product.name}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-beige">
        <img
          src={product.main_image}
          alt={product.name}
          // Hết hàng: làm mờ + xám để phân biệt rõ với sản phẩm còn bán
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
            outOfStock ? "grayscale opacity-60" : ""
          }`}
          loading="lazy"
        />

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {outOfStock ? (
            // Khi hết hàng, badge "Hết hàng" thay cho các nhãn New / Must Have
            <span className="bg-ink/85 text-cream text-[9px] uppercase tracking-widest px-2 py-0.5 font-medium shadow-sm">
              Hết hàng
            </span>
          ) : (
            <>
              {!!product.is_new && (
                <span className="bg-white/90 backdrop-blur-sm text-ink border border-beige-dark text-[9px] uppercase tracking-widest px-2 py-0.5 font-medium shadow-sm">
                  New
                </span>
              )}
              {!!product.is_featured && (
                <span className="bg-ink/90 text-cream text-[9px] uppercase tracking-widest px-2 py-0.5 font-light shadow-sm">
                  Must Have
                </span>
              )}
            </>
          )}
        </div>

        {/* Dải chữ dưới ảnh: còn hàng -> "Xem nhanh" (hiện khi hover);
            hết hàng -> "Tạm hết hàng" hiện cố định để báo rõ trạng thái */}
        <div
          className={`absolute inset-x-0 bottom-0 transition-transform duration-300 ease-out ${
            outOfStock ? "" : "translate-y-full group-hover:translate-y-0"
          }`}
        >
          <span
            className={`block text-[10px] uppercase tracking-[0.25em] text-center py-3 backdrop-blur-sm ${
              outOfStock ? "bg-ink/70 text-cream/80" : "bg-ink/90 text-cream"
            }`}
          >
            {outOfStock ? "Tạm hết hàng" : "Xem nhanh"}
          </span>
        </div>
      </div>

      <div className="pt-4 pb-2 text-center px-1">
        <h3 className="text-[11px] uppercase tracking-wider font-light text-ink leading-relaxed truncate group-hover:text-ink-soft transition-colors">
          {product.name}
        </h3>

        <p
          className={`mt-1.5 text-[11px] tracking-widest font-medium ${
            outOfStock ? "text-ink-soft/50 line-through" : "text-accent"
          }`}
        >
          {formatPrice(product.price)}
        </p>

        {!outOfStock && product.sold_count > 0 && (
          <p className="text-[9px] uppercase tracking-widest text-ink-soft/60 font-light mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Đã bán {product.sold_count}
          </p>
        )}
      </div>
    </Link>
  );
}
