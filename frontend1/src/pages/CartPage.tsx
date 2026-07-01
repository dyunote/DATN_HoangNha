import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import PageHeader from '../components/PageHeader';

export default function CartPage() {
  const { cart, loading, updateQuantity, removeFromCart, selectItem, selectAll, applyVoucher, voucherCode } = useCart();
  const [voucherInput, setVoucherInput] = useState(voucherCode || '');
  const [voucherError, setVoucherError] = useState('');
  const navigate = useNavigate();

  if (loading && !cart) return <p className="text-ink-soft">Đang tải...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Giỏ hàng" title="Giỏ hàng của bạn" />
        <div className="text-center py-20 border border-beige bg-white">
          <p className="text-ink-soft mb-6">Giỏ hàng của bạn đang trống.</p>
          <Link to="/products" className="hn-btn">
            Tiếp tục mua sắm <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleApplyVoucher = async () => {
    setVoucherError('');
    try {
      await applyVoucher(voucherInput.trim());
    } catch (err) {
      setVoucherError(getErrorMessage(err, 'Voucher không hợp lệ'));
    }
  };

  const selectedCount = cart.selected_count ?? cart.items.filter((i) => !!i.is_selected).length;
  const allSelected = selectedCount === cart.items.length;

  return (
    <div>
      <PageHeader eyebrow="Giỏ hàng" title="Giỏ hàng của bạn" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {/* Thanh chọn tất cả */}
          <label className="flex items-center gap-2 hn-panel px-4 py-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => selectAll(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-accent)]"
            />
            <span className="font-medium text-ink">Chọn tất cả ({cart.items.length} sản phẩm)</span>
            <span className="ml-auto text-ink-soft">Đã chọn {selectedCount}</span>
          </label>

          {cart.items.map((item) => (
            <div
              key={item.cart_item_id}
              className={`flex gap-3 bg-white border p-3 transition-colors ${
                item.is_selected ? 'border-accent' : 'border-beige'
              }`}
            >
              <input
                type="checkbox"
                checked={!!item.is_selected}
                onChange={(e) => selectItem(item.cart_item_id, e.target.checked)}
                className="mt-1 w-4 h-4 accent-[var(--color-accent)] self-start"
                aria-label={`Chọn ${item.product_name}`}
              />
              <img loading="lazy" src={item.image} alt={item.product_name} className="w-20 h-24 object-cover bg-beige" />
              <div className="flex-1">
                <p className="font-medium text-ink">{item.product_name}</p>
                <p className="text-sm text-ink-soft">
                  Size: {item.size} · Màu: {item.color}
                </p>
                <p className="text-accent font-medium mt-1">{formatPrice(item.price)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeFromCart(item.cart_item_id)}
                  className="text-xs uppercase tracking-wider text-ink-soft hover:text-accent transition-colors"
                >
                  Xóa
                </button>
                <div className="flex items-center border border-beige-dark">
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 hover:text-accent transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="w-8 h-8 hover:text-accent transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hn-panel p-5 h-fit">
          <h2 className="text-sm uppercase tracking-[0.18em] text-ink mb-4">Tóm tắt đơn hàng</h2>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              placeholder="Mã voucher"
              className="hn-input flex-1"
            />
            <button onClick={handleApplyVoucher} className="hn-btn-dark hn-btn-sm">
              Áp dụng
            </button>
          </div>
          {voucherError && <p className="text-xs text-accent mb-2">{voucherError}</p>}
          {cart.voucher && <p className="text-xs text-emerald-600 mb-2">Đã áp dụng mã {cart.voucher.code}</p>}

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Tạm tính ({selectedCount} SP đã chọn)</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            {cart.member_discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Ưu đãi thành viên (-{(cart.member_discount_rate * 100).toFixed(0)}%)</span>
                <span>-{formatPrice(cart.member_discount)}</span>
              </div>
            )}
            {cart.voucher_discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Giảm giá voucher</span>
                <span>-{formatPrice(cart.voucher_discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-soft">
              <span>Phí vận chuyển</span>
              <span>Tính ở bước thanh toán</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t border-beige pt-3 mt-2">
              <span>Tạm tính tiền hàng</span>
              <span className="text-accent">{formatPrice(cart.total)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout', { state: { voucher_code: cart.voucher?.code } })}
            disabled={selectedCount === 0}
            className="hn-btn w-full mt-5"
          >
            {selectedCount === 0 ? 'Hãy chọn sản phẩm' : `Đặt hàng (${selectedCount} sản phẩm)`}
          </button>
        </div>
      </div>
    </div>
  );
}
