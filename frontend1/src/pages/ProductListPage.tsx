import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import PageHeader from '../components/PageHeader';
import { ProductGridSkeleton } from '../components/Skeleton';
import type { ApiResponse, Category, ProductListItem } from '../types';

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'new', label: 'Mới về' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'featured', label: 'Nổi bật' },
  { value: 'mostliked', label: 'Yêu thích' },
];

const PAGE_SIZE = 12;

// Cac muc gia co dinh cho khach chon (theo moc 100/200/400/500 nghin)
const PRICE_RANGES = [
  { label: 'Dưới 100k', min: '', max: '100000' },
  { label: '100k - 200k', min: '100000', max: '200000' },
  { label: '200k - 400k', min: '200000', max: '400000' },
  { label: '400k - 500k', min: '400000', max: '500000' },
  { label: 'Trên 500k', min: '500000', max: '' },
];

interface PagedProducts {
  items: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const category_id = searchParams.get('category_id') || '';
  const sort = searchParams.get('sort') || '';
  const search = searchParams.get('search') || '';
  const tab = searchParams.get('tab') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    api.get<ApiResponse<Category[]>>('/categories').then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) };
    if (category_id) params.category_id = category_id;
    if (sort) params.sort = sort;
    if (search) params.search = search;
    if (tab) params.tab = tab;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;

    api
      .get<ApiResponse<PagedProducts>>('/products', { params })
      .then((res) => {
        setProducts(res.data.data.items);
        setTotalPages(res.data.data.total_pages);
        setTotal(res.data.data.total);
      })
      .finally(() => setLoading(false));
  }, [category_id, sort, search, tab, minPrice, maxPrice, page]);

  // Cap nhat tham so URL; doi bo loc thi quay ve trang 1
  const updateParam = (key: string, value: string, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage && key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  // Chon 1 muc gia co dinh (set ca min va max cung luc)
  const setPriceRange = (min: string, max: string) => {
    const next = new URLSearchParams(searchParams);
    if (min) next.set('min_price', min);
    else next.delete('min_price');
    if (max) next.set('max_price', max);
    else next.delete('max_price');
    next.delete('page');
    setSearchParams(next);
  };

  const clearPrice = () => setPriceRange('', '');

  const goToPage = (p: number) => updateParam('page', String(p), false);

  return (
    <div>
      <PageHeader eyebrow="Shop" title="Sản phẩm" />

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => updateParam('tab', t.value)}
            className={`hn-tab ${tab === t.value ? 'hn-tab-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={category_id}
          onChange={(e) => updateParam('category_id', e.target.value)}
          className="hn-input hn-auto"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="hn-input hn-auto"
        >
          <option value="">Sắp xếp</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="likes">Yêu thích nhất</option>
        </select>

        {search && (
          <span className="px-3 py-2 text-sm bg-beige text-ink-soft">
            Từ khóa: <strong className="text-ink">{search}</strong>
          </span>
        )}
      </div>

      {/* Cac muc gia co dinh cho khach chon */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs uppercase tracking-[0.15em] text-ink-soft mr-1">Khoảng giá</span>
        <button
          onClick={clearPrice}
          className={`hn-tab ${!minPrice && !maxPrice ? 'hn-tab-active' : ''}`}
        >
          Tất cả
        </button>
        {PRICE_RANGES.map((r) => {
          const active = minPrice === r.min && maxPrice === r.max;
          return (
            <button
              key={r.label}
              onClick={() => setPriceRange(r.min, r.max)}
              className={`hn-tab ${active ? 'hn-tab-active' : ''}`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <ProductGridSkeleton count={10} />
      ) : products.length === 0 ? (
        <p className="text-center text-ink-soft py-16">Không tìm thấy sản phẩm phù hợp.</p>
      ) : (
        <>
          <p className="text-xs uppercase tracking-[0.15em] text-ink-soft mb-5">{total} sản phẩm</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-14">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="w-9 h-9 text-sm border border-beige-dark hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:hover:border-beige-dark disabled:hover:text-ink"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-9 h-9 text-sm border transition-colors ${
                    p === page
                      ? 'bg-ink text-cream border-ink'
                      : 'border-beige-dark text-ink-soft hover:border-accent hover:text-accent'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="w-9 h-9 text-sm border border-beige-dark hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:hover:border-beige-dark disabled:hover:text-ink"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
