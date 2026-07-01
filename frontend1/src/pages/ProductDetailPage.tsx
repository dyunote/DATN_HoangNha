import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatDate, formatPrice } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import StarRating from '../components/StarRating';
import type { ApiResponse, ProductDetail } from '../types';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();

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

  if (!product) return <p className="text-ink-soft">Đang tải...</p>;

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
      toast.success('Đã thêm vào giỏ hàng');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Có lỗi xảy ra'));
    }
  };

  const handleSubmitReview = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReviewMessage('');
    try {
      await api.post('/reviews', { product_id: product.id, ...reviewForm });
      toast.success('Cảm ơn bạn đã đánh giá!');
      setReviewForm({ rating: 5, comment: '', image_url: '' });
      load();
    } catch (err) {
      setReviewMessage(getErrorMessage(err, 'Có lỗi xảy ra'));
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-[3/4] bg-beige overflow-hidden mb-3">
            <img src={activeImage || undefined} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            {product.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(img.image_url)}
                className={`w-16 h-20 overflow-hidden border-2 transition-colors ${
                  activeImage === img.image_url ? 'border-accent' : 'border-transparent hover:border-beige-dark'
                }`}
              >
                <img src={img.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl font-medium text-ink mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-3">
            <StarRating value={product.rating.avg_rating} />
            <span className="text-sm text-ink-soft">
              ({product.rating.total} đánh giá) · Đã bán {product.sold_count}
            </span>
          </div>
          <p className="font-display text-2xl text-accent mb-5">{formatPrice(product.price)}</p>
          <p className="text-ink-soft leading-relaxed mb-6 whitespace-pre-line">{product.description}</p>

          <div className="mb-5">
            <p className="hn-label">Kích thước</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSizeChange(s)}
                  className={`min-w-[44px] px-3 py-2 border text-sm transition-colors ${
                    size === s ? 'border-ink bg-ink text-cream' : 'border-beige-dark text-ink-soft hover:border-ink'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="hn-label">Màu sắc</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`px-3 py-2 border text-sm transition-colors ${
                    color === c ? 'border-ink bg-ink text-cream' : 'border-beige-dark text-ink-soft hover:border-ink'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="hn-label">Số lượng</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-beige-dark">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 hover:text-accent transition-colors">
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-12 h-9 text-center bg-transparent focus:outline-none"
                />
                <button onClick={() => setQuantity((q) => q + 1)} className="w-9 h-9 hover:text-accent transition-colors">
                  +
                </button>
              </div>
              {selectedVariant && <span className="text-sm text-ink-soft">Còn lại: {selectedVariant.stock}</span>}
            </div>
          </div>

          <button onClick={handleAddToCart} className="hn-btn w-full sm:w-auto">
            Thêm vào giỏ hàng
          </button>
          {message && <p className="mt-3 text-sm text-accent">{message}</p>}
        </div>
      </div>

      <div className="mt-16">
        <p className="hn-eyebrow">Reviews</p>
        <h2 className="hn-title mb-6">Đánh giá sản phẩm</h2>

        {user && (
          <form onSubmit={handleSubmitReview} className="hn-panel p-5 mb-6 max-w-xl">
            <p className="hn-label">Chấm điểm của bạn</p>
            <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} size="text-2xl" />
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              className="hn-input mt-3"
              rows={3}
            />
            <input
              type="text"
              value={reviewForm.image_url}
              onChange={(e) => setReviewForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="Đường dẫn ảnh (không bắt buộc)"
              className="hn-input mt-2"
            />
            <button type="submit" className="hn-btn hn-btn-sm mt-4">
              Gửi đánh giá
            </button>
            {reviewMessage && <p className="mt-2 text-sm text-accent">{reviewMessage}</p>}
          </form>
        )}
        {!user && (
          <p className="text-sm text-ink-soft mb-6">
            <Link to="/login" className="text-accent hover:text-accent-dark underline underline-offset-2">Đăng nhập</Link> để đánh giá sản phẩm này.
          </p>
        )}

        <div className="space-y-4">
          {product.reviews.length === 0 && <p className="text-ink-soft text-sm">Chưa có đánh giá nào.</p>}
          {product.reviews.map((r) => (
            <div key={r.id} className="border-b border-beige pb-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-ink">{r.user_name}</p>
                <span className="text-xs text-ink-soft/70">{formatDate(r.created_at)}</span>
              </div>
              <StarRating value={r.rating} />
              {r.comment && <p className="text-sm text-ink-soft mt-1">{r.comment}</p>}
              {r.image_url && <img src={r.image_url} alt="" loading="lazy" className="mt-2 w-24 h-24 object-cover bg-beige" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
