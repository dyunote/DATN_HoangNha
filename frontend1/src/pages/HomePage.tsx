import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import Hero from "../components/Hero";
import CollectionCard from "../components/CollectionCard";
import Lookbook from "../components/Lookbook";
import Newsletter from "../components/Newsletter";
import Reveal from "../components/Reveal";
import type { ApiResponse, ProductListItem } from "../types";

// Sample fallback data so the landing page always looks complete (API empty/down)
const SAMPLE_PRODUCTS: ProductListItem[] = [
  { id: 0, category_id: 0, name: "Áo khoác dạ tối giản", description: null, price: 1290000, is_new: 1, is_featured: 1, sold_count: 42, is_hidden: 0, created_at: "", main_image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80" },
  { id: 0, category_id: 0, name: "Áo sơ mi lụa trắng", description: null, price: 650000, is_new: 1, is_featured: 0, sold_count: 18, is_hidden: 0, created_at: "", main_image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80" },
  { id: 0, category_id: 0, name: "Quần âu ống suông", description: null, price: 750000, is_new: 0, is_featured: 1, sold_count: 65, is_hidden: 0, created_at: "", main_image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80" },
  { id: 0, category_id: 0, name: "Đầm linen mùa hè", description: null, price: 890000, is_new: 1, is_featured: 0, sold_count: 31, is_hidden: 0, created_at: "", main_image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80" },
];

interface ProductSectionProps {
  title: string;
  subtitle: string;
  products: ProductListItem[];
  viewAllHref: string;
}

// Minimal editorial product grid — 4 cols desktop / 2 mobile
function ProductSection({ title, subtitle, products, viewAllHref }: ProductSectionProps) {
  if (!products.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-28">
      <Reveal>
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-accent text-[11px] uppercase tracking-[0.35em] mb-3">
              {subtitle}
            </p>
            <h2
              className="font-display text-ink font-medium leading-none"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
            >
              {title}
            </h2>
          </div>
          <Link
            to={viewAllHref}
            className="hidden sm:inline-flex items-center gap-2 text-ink text-xs uppercase tracking-[0.25em] border-b border-ink/30 pb-1 hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
          >
            Xem tất cả <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
        {products.slice(0, 4).map((p, i) => (
          <Reveal key={`${p.id}-${i}`} delay={i * 80}>
            <ProductCard product={p} />
          </Reveal>
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
    const load = (
      tab: string,
      setter: (v: ProductListItem[]) => void
    ) => {
      api
        .get<ApiResponse<ProductListItem[]>>("/products", { params: { tab } })
        .then((res) => {
          const data = res.data.data;
          setter(data && data.length ? data : SAMPLE_PRODUCTS);
        })
        .catch(() => setter(SAMPLE_PRODUCTS));
    };
    load("new", setNewProducts);
    load("bestseller", setBestSellers);
    load("featured", setFeatured);
  }, []);

  return (
    <div className="w-full bg-cream">
      <Hero />

      {/* Featured collections — asymmetric layout */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-28">
        <Reveal>
          <div className="mb-12 max-w-xl">
            <p className="text-accent text-[11px] uppercase tracking-[0.35em] mb-3">
              Bộ sưu tập
            </p>
            <h2
              className="font-display text-ink font-medium leading-none"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
            >
              Tuyển chọn theo phong cách
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Reveal className="md:col-span-7">
            <CollectionCard
              title="Tối giản"
              subtitle="Essentials"
              image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80"
              href="/products?tab=new"
              className="h-[420px] md:h-[560px]"
            />
          </Reveal>
          <div className="md:col-span-5 grid grid-rows-2 gap-6">
            <Reveal delay={120}>
              <CollectionCard
                title="Công sở"
                subtitle="Workwear"
                image="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&q=80"
                href="/products?category=nu"
                className="h-[200px] md:h-[268px]"
              />
            </Reveal>
            <Reveal delay={200}>
              <CollectionCard
                title="Dạo phố"
                subtitle="Everyday"
                image="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=80"
                href="/products?category=nam"
                className="h-[200px] md:h-[268px]"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <ProductSection
        title="Hàng mới về"
        subtitle="New Arrivals"
        products={newProducts}
        viewAllHref="/products?tab=new"
      />

      <Lookbook
        eyebrow="Câu chuyện thương hiệu"
        title="Vẻ đẹp của sự tinh giản"
        body="Hoàng Nha ra đời từ niềm tin rằng thời trang không cần phô trương. Mỗi thiết kế là sự cân bằng giữa phom dáng hiện đại và chất liệu bền vững — để bạn tự tin trong từng khoảnh khắc."
        image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80"
        ctaLabel="Tìm hiểu thêm"
        href="/products"
      />

      <ProductSection
        title="Bán chạy nhất"
        subtitle="Best Sellers"
        products={bestSellers}
        viewAllHref="/products?tab=bestseller"
      />

      <Lookbook
        eyebrow="Lookbook 2026"
        title="Bảng màu mùa mới"
        body="Tông màu trung tính ấm áp kết hợp cùng những điểm nhấn camel đặc trưng. Một bộ sưu tập được tạo nên để phối hợp linh hoạt, đồng hành cùng bạn quanh năm."
        image="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=80"
        ctaLabel="Khám phá bộ sưu tập"
        href="/products?tab=featured"
        reverse
      />

      <ProductSection
        title="Sản phẩm nổi bật"
        subtitle="Featured"
        products={featured}
        viewAllHref="/products?tab=featured"
      />

      <Newsletter />
    </div>
  );
}
