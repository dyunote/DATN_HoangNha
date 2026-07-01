import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice, PAYMENT_METHOD_LABELS } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import type { Address, ApiResponse, Order, PaymentMethod, ProvinceListData, ShippingQuote } from '../types';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { voucher_code?: string } | null;
  const voucherCode = state?.voucher_code || '';

  const [form, setForm] = useState<{
    receiver_name: string;
    phone: string;
    address: string;
    province: string;
    note: string;
    payment_method: PaymentMethod;
  }>({
    receiver_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    province: '',
    note: '',
    payment_method: 'cod',
  });

  const [provinceData, setProvinceData] = useState<ProvinceListData | null>(null);
  const [shipping, setShipping] = useState<ShippingQuote | null>(null);
  const [shipError, setShipError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // So dia chi da luu cua khach; 'new' = dang nhap dia chi khac (khong lay tu so)
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Lay danh sach tinh + nguong freeship
  useEffect(() => {
    api
      .get<ApiResponse<ProvinceListData>>('/shipping/provinces')
      .then((res) => setProvinceData(res.data.data))
      .catch(() => setProvinceData(null));
  }, []);

  // Lay so dia chi da luu, tu dien san dia chi mac dinh (neu co)
  useEffect(() => {
    api
      .get<ApiResponse<Address[]>>('/addresses')
      .then((res) => {
        const list = res.data.data;
        setAddresses(list);
        const def = list.find((a) => !!a.is_default) || list[0];
        if (def) {
          setSelectedAddressId(def.id);
          setForm((f) => ({
            ...f,
            receiver_name: def.receiver_name,
            phone: def.phone,
            province: def.province,
            address: def.address,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const pickAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setForm((f) => ({
      ...f,
      receiver_name: addr.receiver_name,
      phone: addr.phone,
      province: addr.province,
      address: addr.address,
    }));
  };

  const pickNewAddress = () => {
    setSelectedAddressId('new');
    setForm((f) => ({ ...f, receiver_name: user?.full_name || '', phone: user?.phone || '', province: '', address: '' }));
  };

  // Tinh phi ship moi khi doi tinh hoac tong tien hang
  const goodsTotal = cart?.total || 0;
  useEffect(() => {
    if (!form.province) {
      setShipping(null);
      return;
    }
    setShipError('');
    api
      .post<ApiResponse<ShippingQuote>>('/shipping/quote', { province: form.province, order_amount: goodsTotal })
      .then((res) => setShipping(res.data.data))
      .catch((err) => {
        setShipping(null);
        setShipError(getErrorMessage(err, 'Không tính được phí vận chuyển'));
      });
  }, [form.province, goodsTotal]);

  if (!cart || cart.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const shippingFee = shipping?.shipping_fee ?? 0;
  const grandTotal = goodsTotal + shippingFee;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.province) {
      setError('Vui lòng chọn tỉnh/thành nhận hàng để tính phí vận chuyển');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<Order>>('/orders', {
        ...form,
        voucher_code: voucherCode || undefined,
      });

      // Neu khach nhap dia chi khac va tick "luu vao so" -> luu them, khong chan don hang neu loi
      if (selectedAddressId === 'new' && saveNewAddress) {
        api
          .post('/addresses', {
            receiver_name: form.receiver_name,
            phone: form.phone,
            province: form.province,
            address: form.address,
          })
          .catch(() => {});
      }

      await refreshCart();
      toast.success('Đặt hàng thành công');
      navigate(`/order-success/${res.data.data.id}`, { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err, 'Đặt hàng thất bại');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Thanh toán" title="Hoàn tất đơn hàng" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 hn-panel p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-[0.18em] text-ink">Thông tin nhận hàng</h2>

          {addresses.length > 0 && (
            <div>
              <label className="hn-label">Địa chỉ giao hàng</label>
              <div className="space-y-2">
                {addresses.map((addr) => {
                  const active = selectedAddressId === addr.id;
                  return (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-2 text-sm border px-3 py-2.5 cursor-pointer transition-colors ${
                        active ? 'border-accent bg-accent/5' : 'border-beige hover:border-beige-dark'
                      }`}
                    >
                      <input
                        type="radio"
                        name="saved_address"
                        checked={active}
                        onChange={() => pickAddress(addr)}
                        className="mt-0.5 accent-[var(--color-accent)]"
                      />
                      <span>
                        <span className="font-medium text-ink">
                          {addr.receiver_name} · {addr.phone}
                        </span>
                        {!!addr.is_default && (
                          <span className="hn-badge bg-green-100 text-green-700 ml-2">Mặc định</span>
                        )}
                        <br />
                        <span className="text-ink-soft">
                          {addr.address}, {addr.province}
                        </span>
                      </span>
                    </label>
                  );
                })}
                <label
                  className={`flex items-center gap-2 text-sm border px-3 py-2.5 cursor-pointer transition-colors ${
                    selectedAddressId === 'new' ? 'border-accent bg-accent/5' : 'border-beige hover:border-beige-dark'
                  }`}
                >
                  <input
                    type="radio"
                    name="saved_address"
                    checked={selectedAddressId === 'new'}
                    onChange={pickNewAddress}
                    className="accent-[var(--color-accent)]"
                  />
                  Giao đến địa chỉ khác
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="hn-label">Họ và tên</label>
            <input name="receiver_name" value={form.receiver_name} onChange={handleChange} required className="hn-input" />
          </div>
          <div>
            <label className="hn-label">Số điện thoại</label>
            <input name="phone" value={form.phone} onChange={handleChange} required className="hn-input" />
          </div>
          <div>
            <label className="hn-label">Tỉnh / Thành phố nhận hàng</label>
            <select name="province" value={form.province} onChange={handleChange} required className="hn-input">
              <option value="">-- Chọn tỉnh/thành --</option>
              {provinceData?.provinces.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            {provinceData && (
              <p className="text-xs text-ink-soft mt-1.5">
                Giao từ kho {provinceData.shop_province}. Miễn phí ship cho đơn từ{' '}
                {formatPrice(provinceData.free_ship_threshold)}.
              </p>
            )}
          </div>
          <div>
            <label className="hn-label">Địa chỉ chi tiết (số nhà, đường, phường/xã)</label>
            <input name="address" value={form.address} onChange={handleChange} required className="hn-input" />
          </div>
          {selectedAddressId === 'new' && (
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={saveNewAddress}
                onChange={(e) => setSaveNewAddress(e.target.checked)}
                className="accent-[var(--color-accent)]"
              />
              Lưu địa chỉ này vào sổ địa chỉ của tôi
            </label>
          )}
          <div>
            <label className="hn-label">Ghi chú</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows={2} class