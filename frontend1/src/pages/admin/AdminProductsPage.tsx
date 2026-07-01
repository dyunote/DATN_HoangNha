import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';
import type { ApiResponse, Category, ProductListItem } from '../../types';

// So san pham moi trang (trang quan tri)
const PAGE_SIZE = 10;

// Kieu du lieu tra ve khi goi API co phan trang
interface PagedProducts {
  items: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Bo loc
  const [search, setSearch] = useState(''); // gia tri o input (cap nhat tuc thi)
  const [debouncedSearch, setDebouncedSearch] = useState(''); // gia tri dung de goi API
  const [categoryId, setCategoryId] = useState('');

  // Tai danh muc 1 lan de do vao select
  useEffect(() => {
    api.get<ApiResponse<Category[]>>('/categories').then((res) => setCategories(res.data.data));
  }, []);

  // Debounce o tim kiem: cho 400ms sau khi ngung go moi goi API
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Doi bo loc thi quay ve trang 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId]);

  // Tai danh sach khi doi trang hoac doi bo loc
  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (categoryId) params.category_id = categoryId;

    api
      .get<ApiResponse<PagedProducts>>('/admin/products', { params })
      .then((res) => {
        const d = res.data.data;
        setProducts(d.items);
        setTotalPages(d.total_pages);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, categoryId]);

  // Goi lai API trang hien tai (dung sau khi an/hien/xoa)
  const reload = () => {
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (categoryId) params.category_id = categoryId;
    api.get<ApiResponse<PagedProducts>>('/admin/products', { params }).then((res) => {
      const d = res.data.data;
      setProducts(d.items);
      setTotalPages(d.total_pages);
      setTotal(d.total);
    });
  };

  const toggleHidden = async (product: ProductListItem) => {
    await api.patch(`/admin/products/${product.id}/hidden`, { is_hidden: !product.is_hidden });
    reload();
  };

  const handleDelete = async (product: ProductListItem) => {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    await api.delete(`/admin/products/${product.id}`);
    // Neu xoa phan tu cuoi cua trang > 1 thi lui ve trang truoc, con lai tai lai
    if (products.length === 1 && page > 1) setPage((p) => p - 1);
    else reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">Quản lý sản phẩm</h1>
        <Link to="/admin/products/new" className="hn-btn hn-btn-sm">
          + Thêm sản phẩm
        </Link>
      </div>

      {/* Bo loc: tim kiem theo ten + loc theo danh muc */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên sản phẩm..."
          className="hn-input flex-1 min-w-[220px]"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="hn-input hn-auto"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {(search || categoryId) && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryId('');
            }}
            className="hn-btn-outline hn-btn-sm"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-ink-soft">Đang tải...</p>
      ) : (
        <>
          <p className="text-xs uppercase tracking-[0.15em] text-ink-soft mb-3">{total} sản phẩm</p>

          {products.length === 0 ? (
            <p className="text-center text-ink-soft py-16">Không tìm thấy sản phẩm phù hợp.</p>
          ) : (
            <div className="hn-panel overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-beige/60 text-left text-xs uppercase tracking-[0.1em] text-ink-soft">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ảnh</th>
                    <th className="px-4 py-3 font-medium">Tên</th>
                    <th className="px-4 py-3 font-medium">Danh mục</th>
                    <th className="px-4 py-3 font-medium">Giá</th>
                    <th className="px-4 py-3 font-medium">Tồn kho</th>
                    <th className="px-4 py-3 font-medium">Đã bán</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-beige">
                      <td className="px-4 py-2">
                        <img src={p.main_image} alt={p.name} loading="lazy" className="w-12 h-14 object-cover bg-beige" />
                      </td>
                      <td className="px-4 py-2 font-medium text-ink">{p.name}</td>
                      <td className="px-4 py-2 text-ink-soft">{p.category_name}</td>
                      <td className="px-4 py-2">{formatPrice(p.price)}</td>
                      <td className="px-4 py-2">
                        {(() => {
                          const stock = p.total_stock ?? 0;
                          const cls = stock < 10 ? 'bg-accent/10 text-accent-dark' : 'bg-emerald-100 text-emerald-700';
                          const label = stock === 0 ? 'Hết hàng' : `${stock}`;
                          return <span className={`hn-badge ${cls}`}>{label}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-2">{p.sold_count}</td>
                      <td className="px-4 py-2">
                        {p.is_hidden ? (
                          <span className="hn-badge bg-beige text-ink-soft">Đã ẩn</span>
                        ) : (
                          <span className="hn-badge bg-emerald-100 text-emerald-700">Đang bán</span>
                        )}
                      </td>
                      <td className="px-4 py-2 space-x-3 whitespace-nowrap text-xs uppercase tracking-wider">
                        <Link to={`/admin/products/${p.id}/edit`} className="text-ink hover:text-accent transition-colors">
                          Sửa
                        </Link>
                        <button onClick={() => toggleHidden(p)} className="text-ink-soft hover:text-accent transition-colors">
                          {p.is_hidden ? 'Hiện' : 'Ẩn'}
                        </button>
                        <button onClick={() => handleDelete(p)} className="text-red-600 hover:text-red-700 transition-colors">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Thanh phan trang */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-9 h-9 text-sm border border-beige-dark hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:hover:border-beige-dark disabled:hover:text-ink"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
