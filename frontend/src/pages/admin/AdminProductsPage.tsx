import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';
import type { ApiResponse, ProductListItem } from '../../types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get<ApiResponse<ProductListItem[]>>('/admin/products')
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleHidden = async (product: ProductListItem) => {
    await api.patch(`/admin/products/${product.id}/hidden`, { is_hidden: !product.is_hidden });
    load();
  };

  const handleDelete = async (product: ProductListItem) => {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    await api.delete(`/admin/products/${product.id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <Link to="/admin/products/new" className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Thêm sản phẩm
        </Link>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Ảnh</th>
                <th className="px-4 py-2">Tên</th>
                <th className="px-4 py-2">Danh mục</th>
                <th className="px-4 py-2">Giá</th>
                <th className="px-4 py-2">Đã bán</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <img src={p.main_image} alt={p.name} className="w-12 h-14 object-cover rounded" />
                  </td>
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2">{p.category_name}</td>
                  <td className="px-4 py-2">{formatPrice(p.price)}</td>
                  <td className="px-4 py-2">{p.sold_count}</td>
                  <td className="px-4 py-2">
                    {p.is_hidden ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">Đã ẩn</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Đang bán</span>
                    )}
                  </td>
                  <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                    <Link to={`/admin/products/${p.id}/edit`} className="text-blue-600 hover:underline">
                      Sửa
                    </Link>
                    <button onClick={() => toggleHidden(p)} className="text-amber-600 hover:underline">
                      {p.is_hidden ? 'Hiện' : 'Ẩn'}
                    </button>
                    <button onClick={() => handleDelete(p)} className="text-rose-600 hover:underline">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
