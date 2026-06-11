import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import type { ApiResponse, ProductListItem } from "../types";

interface ProductSectionProps {
  title: string;
  products: ProductListItem[];
  viewAllHref: string;
}

// 1. DANH MỤC SẢN PHẨM CHUẨN 4 CỘT THEO FIGMA
function ProductSection({ title, products, viewAllHref }: ProductSectionProps) {
  if (!products.length) return null;
  return (
    <section className="mb-20 text-center">
      {/* Tiêu đề danh mục tối giản */}
      <div className="flex flex-col items-center justify-center mb-10">
        <h2 className="text-sm tracking-[0.25em] font-medium text-gray-950 uppercase">
          {title}
        </h2>
        <div className="w-6 h-[1px] bg-gray-300 mt-3 mb-2"></div>
        <Link
          to={viewAllHref}
          className="text-[10px] uppercase tracking-widest text-[#a3704c] hover:text-gray-900 transition-colors duration-300"
        >
          Xem tất cả &rarr;
        </Link>
      </div>

      {/* Grid 4 cột cân đối */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [newProducts, setNewProducts] = useState<ProductListItem[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductListItem[]>([]);
  const [featured, setFeatured] = useState<ProductListItem[]>([]);

  useEffect(() => {
    api
      .get<
        ApiResponse<ProductListItem[]>
      >("/products", { params: { tab: "new" } })
      .then((res) => setNewProducts(res.data.data));
    api
      .get<
        ApiResponse<ProductListItem[]>
      >("/products", { params: { tab: "bestseller" } })
      .then((res) => setBestSellers(res.data.data));
    api
      .get<
        ApiResponse<ProductListItem[]>
      >("/products", { params: { tab: "featured" } })
      .then((res) => setFeatured(res.data.data));
  }, []);

  return (
    <div className="w-full bg-white min-h-screen">
      {/* 2. BANNER THUẦN HÌNH ẢNH NẰM NGANG (TỐI GIẢN & SANG TRỌNG) */}
      <div className="w-full mb-16 overflow-hidden bg-gray-50 group">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bạn có thể chỉnh sửa chiều cao tại h-[350px] hoặc md:h-[480px] để hợp mắt nhất */}
          <div className="w-full h-[300px] sm:h-[400px] md:h-[480px] relative overflow-hidden">
            <img
              src="/public/images/banner.png" 
              alt="Hoàng Nha Fashion Campaign"
              className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
              onError={(e) => {
                // Fallback hiển thị màu nhã nhặn nếu chưa có file ảnh thực tế
                e.currentTarget.style.display = "none";
                const fallback = document.getElementById(
                  "pure-banner-fallback",
                );
                if (fallback)
                  fallback.className =
                    "w-full h-full bg-gradient-to-r from-gray-50 via-[#a3704c]/5 to-gray-50 flex items-center justify-center border border-gray-100";
              }}
            />

            {/* Vùng hiển thị tạm thời khi chưa có hình ảnh */}
            <div id="pure-banner-fallback" className="hidden">
              <span className="text-gray-300 font-serif italic text-xs tracking-widest uppercase">
                [ Nơi hiển thị hình ảnh Banner Campaign Ngang ]
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHU VỰC SẢN PHẨM PHÍA DƯỚI BANNER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductSection
          title="New Arrival"
          products={newProducts}
          viewAllHref="/products?tab=new"
        />
        <ProductSection
          title="Bán chạy nhất"
          products={bestSellers}
          viewAllHref="/products?tab=bestseller"
        />
        <ProductSection
          title="Sản phẩm nổi bật"
          products={featured}
          viewAllHref="/products?tab=featured"
        />
      </main>
    </div>
  );
}
