import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import type { ApiResponse, Category, ProductListItem } from '../types';

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'new', label: 'Mới về' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'featured', label: 'Nổi bật' },
];

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const category_id = searchParams.get('category_id') || '';
  const sort = searchParams.get('sort') || '';
  const search = searchParams.get('search') || '';
  const tab = searchParams.get('tab') || '';

  useEffect(() => {
    api.get<ApiResponse<Category[]>>('/categories').then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (category_id) params.category_id = category_id;
    if (sort) params.sort = sort;
    if (search) params.search = search;
    if (tab) params.tab = tab;

    api
      .get<ApiResponse<ProductListItem[]>>('/products', { params })
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
  }, [category_id, sort, search, tab]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Sản phẩm</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => updateParam('tab', t.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
              tab === t.value ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={category_id}
          onChange={(e) => updateParam('category_id', e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
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
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Sắp xếp</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
        </select>

        {search && (
          <span className="px-3 py-1.5 text-sm bg-gray-100 rounded">
            Từ khóa: <strong>{search}</strong>
          </span>
        )}
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Không tìm thấy sản phẩm</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
