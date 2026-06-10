import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { getErrorMessage } from '../utils/error';

export default function CartPage() {
  const { cart, loading, updateQuantity, removeFromCart, applyVoucher, voucherCode } = useCart();
  const [voucherInput, setVoucherInput] = useState(voucherCode || '');
  const [voucherError, setVoucherError] = useState('');
  const navigate = useNavigate();

  if (loading && !cart) return <p>Đang tải...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Giỏ hàng của bạn đang trống.</p>
        <Link to="/products" className="text-rose-600 font-medium hover:underline">
          Tiếp tục mua sắm →
        </Link>
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Giỏ hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <div key={item.cart_item_id} className="flex gap-3 bg-white border border-gray-200 rounded-lg p-3">
              <img src={item.image} alt={item.product_name} className="w-20 h-24 object-cover rounded" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.product_name}</p>
                <p className="text-sm text-gray-500">
                  Size: {item.size} · Màu: {item.color}
                </p>
                <p className="text-rose-600 font-semibold mt-1">{formatPrice(item.price)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeFromCart(item.cart_item_id)}
                  className="text-xs text-gray-400 hover:text-rose-600"
                >
                  Xóa
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                    className="w-7 h-7 border border-gray-300 rounded"
                  >
                    -
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="w-7 h-7 border border-gray-300 rounded disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 h-fit">
          <h2 className="font-semibold mb-3">Tóm tắt đơn hàng</h2>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              placeholder="Mã voucher"
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
            <button onClick={handleApplyVoucher} className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded">
              Áp dụng
            </button>
          </div>
          {voucherError && <p className="text-xs text-rose-600 mb-2">{voucherError}</p>}
          {cart.voucher && <p className="text-xs text-emerald-600 mb-2">Đã áp dụng mã {cart.voucher.code}</p>}

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>Tạm tính</span>
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
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2">
              <span>Tổng cộng</span>
              <span className="text-rose-600">{formatPrice(cart.total)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout', { state: { voucher_code: cart.voucher?.code } })}
            className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg"
          >
            Tiến hành đặt hàng
          </button>
        </div>
      </div>
    </div>
  );
}
