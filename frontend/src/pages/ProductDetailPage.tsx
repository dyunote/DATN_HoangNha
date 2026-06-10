import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatDate, formatPrice } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import StarRating from '../components/StarRating';
import type { ApiResponse, ProductDetail } from '../types';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', image_url: '' });
  const [reviewMessage, setReviewMessage] = useState('');

  const load = () => {
    api.get<ApiResponse<ProductDetail>>(`/products/${id}`).then((res) => {
      const data = res.data.data;
      setProduct(data);
      setActiveImage(data.images?.[0]?.image_url || data.main_image || null);
      if (data.variants?.length) {
        setSize(data.variants[0].size);
        setColor(data.variants[0].color);
      }
    });
  };

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!product) return <p>Đang tải...</p>;

  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const colors = [...new Set(product.variants.filter((v) => v.size === size).map((v) => v.color))];
  const selectedVariant = product.variants.find((v) => v.size === size && v.color === color);

  const handleSizeChange = (newSize: string) => {
    setSize(newSize);
    const firstColor = product.variants.find((v) => v.size === newSize)?.color || '';
    setColor(firstColor);
  };

  const handleAddToCart = async () => {
    setMessage('');
    if (!user) {
      setMessage('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    if (!selectedVariant) {
      setMessage('Vui lòng chọn size và màu sắc');
      return;
    }
    if (selectedVariant.stock < quantity) {
      setMessage('Số lượng tồn kho không đủ');
      return;
    }
    try {
      await addToCart(selectedVariant.id, quantity);
      setMessage('Đã thêm vào giỏ hàng');
    } catch (err) {
      setMessage(getErrorMessage(err, 'Có lỗi xảy ra'));
    }
  };

  const handleSubmitReview = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReviewMessage('');
    try {
      await api.post('/reviews', { product_id: product.id, ...reviewForm });
      setReviewMessage('Cảm ơn bạn đã đánh giá!');
      setReviewForm({ rating: 5, comment: '', image_url: '' });
      load();
    } catch (err) {
      setReviewMessage(getErrorMessage(err, 'Có lỗi xảy ra'));
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
            <img src={activeImage || undefined} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            {product.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(img.image_url)}
                className={`w-16 h-20 rounded overflow-hidden border-2 ${
                  activeImage === img.image_url ? 'border-rose-500' : 'border-transparent'
                }`}
              >
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-2">
            <StarRating value={product.rating.avg_rating} />
            <span className="text-sm text-gray-500">
              ({product.rating.total} đánh giá) · Đã bán {product.sold_count}
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-600 mb-4">{formatPrice(product.price)}</p>
          <p className="text-gray-600 mb-4 whitespace-pre-line">{product.description}</p>

          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Kích thước</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSizeChange(s)}
                  className={`px-3 py-1.5 border rounded text-sm ${
                    size === s ? 'border-rose-600 bg-rose-50 text-rose-600' : 'border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Màu sắc</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`px-3 py-1.5 border rounded text-sm ${
                    color === c ? 'border-rose-600 bg-rose-50 text-rose-600' : 'border-gray-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Số lượng</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 border border-gray-300 rounded"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-14 h-8 text-center border border-gray-300 rounded"
              />
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 border border-gray-300 rounded"
              >
                +
              </button>
              {selectedVariant && (
                <span className="text-sm text-gray-500 ml-2">Còn lại: {selectedVariant.stock}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-2.5 rounded-lg"
          >
            Thêm vào giỏ hàng
          </button>
          {message && <p className="mt-2 text-sm text-rose-600">{message}</p>}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Đánh giá sản phẩm</h2>

        {user && (
          <form onSubmit={handleSubmitReview} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 max-w-xl">
            <p className="text-sm font-medium mb-2">Chấm điểm của bạn</p>
            <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} size="text-2xl" />
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              className="w-full border border-gray-300 rounded mt-3 p-2 text-sm"
              rows={3}
            />
            <input
              type="text"
              value={reviewForm.image_url}
              onChange={(e) => setReviewForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="Đường dẫn ảnh (không bắt buộc)"
              className="w-full border border-gray-300 rounded mt-2 p-2 text-sm"
            />
            <button type="submit" className="mt-3 bg-rose-600 text-white px-4 py-2 rounded text-sm font-medium">
              Gửi đánh giá
            </button>
            {reviewMessage && <p className="mt-2 text-sm">{reviewMessage}</p>}
          </form>
        )}
        {!user && (
          <p className="text-sm text-gray-500 mb-6">
            <Link to="/login" className="text-rose-600 hover:underline">Đăng nhập</Link> để đánh giá sản phẩm này.
          </p>
        )}

        <div className="space-y-4">
          {product.reviews.length === 0 && <p className="text-gray-500 text-sm">Chưa có đánh giá nào.</p>}
          {product.reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{r.user_name}</p>
                <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
              </div>
              <StarRating value={r.rating} />
              {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              {r.image_url && <img src={r.image_url} alt="" className="mt-2 w-24 h-24 object-cover rounded" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
