import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import type { ApiResponse, ProductListItem } from '../types';

interface ProductSectionProps {
  title: string;
  products: ProductListItem[];
  viewAllHref: string;
}

function ProductSection({ title, products, viewAllHref }: ProductSectionProps) {
  if (!products.length) return null;
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <Link to={viewAllHref} className="text-sm text-rose-600 hover:underline">
          Xem tất cả →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.slice(0, 5).map((p) => (
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
    const fetchHomeData = async () => {
      try {
        // Gọi cả 3 API cùng lúc bằng Promise.all để tối ưu tốc độ load trang
        const [newRes, bestRes, featuredRes] = await Promise.all([
          api.get<ApiResponse<ProductListItem[]>>('/products', { params: { tab: 'new' } }),
          api.get<ApiResponse<ProductListItem[]>>('/products', { params: { tab: 'bestseller' } }),
          api.get<ApiResponse<ProductListItem[]>>('/products', { params: { tab: 'featured' } }),
        ]);

        // Kiểm tra cấu hình trả về của Axios Instance trong dự án nhóm
        // Nếu lỗi đỏ xuất hiện lại ở dòng gạch dưới `.data.data`, hãy xóa bớt 1 chữ `.data` đi thành `newRes.data`
        if (newRes.data?.data) setNewProducts(newRes.data.data);
        if (bestRes.data?.data) setBestSellers(bestRes.data.data);
        if (featuredRes.data?.data) setFeatured(featuredRes.data.data);

      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm trang chủ:", error);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div>
      {/* Banner hoàng nha fashion */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl text-white p-10 mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Hoàng Nha Fashion</h1>
        <p className="mb-4">Phong cách của bạn, lựa chọn của chúng tôi</p>
        <Link to="/products" className="inline-block bg-white text-rose-600 font-semibold px-6 py-2 rounded-full hover:bg-gray-100">
          Mua sắm ngay
        </Link>
      </div>

      {/* Các danh mục sản phẩm */}
      <ProductSection title="Sản phẩm mới" products={newProducts} viewAllHref="/products?tab=new" />
      <ProductSection title="Bán chạy nhất" products={bestSellers} viewAllHref="/products?tab=bestseller" />
      <ProductSection title="Nổi bật" products={featured} viewAllHref="/products?tab=featured" />
    </div>
  );
}