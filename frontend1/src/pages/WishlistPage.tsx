import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import PageHeader from '../components/PageHeader';
import { useWishlist } from '../context/WishlistContext';
import type { ApiResponse, ProductListItem } from '../types';

export default function WishlistPage() {
  const { has, ids } = useWishlist();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<ApiResponse<ProductListItem[]>>('/wishlist')
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
    // tai lai khi so luong yeu thich thay doi (vd vua them tu trang khac)
  }, [ids.length]);

  // Loc theo trang thai realtime: bo tim o day se an ngay
  const visible = products.filter((p) => has(p.id));

  if (loading) return <p className="text-ink-soft">Đang tải...</p>;

  return (
    <div>
      <PageHeader eyebrow="Wishlist" title="Sản phẩm yêu thích" />

      {visible.length === 0 ? (
        <div className="text-center py-20 border border-beige bg-white">
          <p className="text-ink-soft mb-6">Bạn chưa có sản phẩm yêu thích nào.</p>
          <Link to="/products" className="hn-btn">
            Khám phá sản phẩm <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
