import { Link, useParams } from 'react-router-dom';

// Trang xac nhan sau khi dat hang thanh cong.
export default function OrderSuccessPage() {
  const { id } = useParams();

  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="font-display text-2xl text-ink mb-2">Đặt hàng thành công!</h1>
      <p className="text-ink-soft mb-1">Cảm ơn bạn đã mua sắm tại Hoàng Nha.</p>
      {id && <p className="text-ink-soft mb-8">Mã đơn hàng của bạn: <strong className="text-ink">#{id}</strong></p>}
      <div className="flex flex-wrap gap-3 justify-center">
        {id && (
          <Link to={`/orders/${id}`} className="hn-btn">
            Xem chi tiết đơn (thanh toán)
          </Link>
        )}
        <Link to="/products" className="hn-btn-outline">
          Tiếp tục mua sắm
        </Link>
      </div>
      <p className="text-xs text-ink-soft mt-6">
        Nếu chọn chuyển khoản, vui lòng vào "Xem chi tiết đơn" để lấy mã QR thanh toán.
      </p>
    </div>
  );
}
