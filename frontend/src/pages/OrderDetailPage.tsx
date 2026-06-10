import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { formatDate, formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../utils/format';
import { BANK_INFO, buildVietQrUrl } from '../config/bank';
import type { ApiResponse, Order } from '../types';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<Order>>(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Đang tải...</p>;
  if (!order) return <p>Không tìm thấy đơn hàng.</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/orders" className="text-sm text-rose-600 hover:underline">
        ← Quay lại danh sách đơn hàng
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mt-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Đơn hàng #{order.id}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="text-sm space-y-1 mb-4 text-gray-600">
          <p>Ngày đặt: {formatDate(order.created_at)}</p>
          <p>Người nhận: {order.receiver_name}</p>
          <p>Số điện thoại: {order.phone}</p>
          <p>Địa chỉ: {order.address}</p>
          {order.note && <p>Ghi chú: {order.note}</p>}
          {order.payment && (
            <p>
              Thanh toán: {PAYMENT_METHOD_LABELS[order.payment.method]} -{' '}
              {order.payment.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </p>
          )}
        </div>

        <h2 className="font-semibold mb-2">Sản phẩm</h2>
        <div className="space-y-2 mb-4">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex gap-3 items-center">
              <img src={item.image} alt={item.product_name} className="w-14 h-16 object-cover rounded" />
              <div className="flex-1 text-sm">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-gray-500">
                  Size: {item.size} · Màu: {item.color} · SL: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
          <span>Tổng cộng</span>
          <span className="text-rose-600">{formatPrice(order.total_amount)}</span>
        </div>

        {order.payment?.method === 'bank_transfer' && order.payment.status !== 'paid' && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center mt-4">
            <p className="text-sm font-medium mb-2">Quét mã QR để thanh toán đơn #{order.id}</p>
            <img
              src={buildVietQrUrl(Number(order.total_amount), `DH${order.id}`)}
              alt="Ma QR chuyen khoan"
              className="w-56 h-auto mx-auto rounded border border-gray-200 bg-white"
            />
            <div className="text-sm text-gray-600 mt-3 space-y-0.5">
              <p>Ngân hàng: <span className="font-medium uppercase">{BANK_INFO.bankCode}</span></p>
              <p>Số tài khoản: <span className="font-medium">{BANK_INFO.accountNo}</span></p>
              <p>Chủ tài khoản: <span className="font-medium">{BANK_INFO.accountName}</span></p>
              <p>Nội dung: <span className="font-medium">DH{order.id}</span></p>
              <p>Số tiền: <span className="font-semibold text-rose-600">{formatPrice(order.total_amount)}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
