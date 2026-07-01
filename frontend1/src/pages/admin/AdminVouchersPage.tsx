import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import api from '../../api/axios';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/error';
import type { ApiResponse, DiscountType, Voucher } from '../../types';

interface VoucherForm {
  code: string;
  discount_type: DiscountType;
  discount_value: string | number;
  start_date: string;
  end_date: string;
  quantity: string | number;
  is_active: boolean;
}

const emptyForm: VoucherForm = {
  code: '',
  discount_type: 'percent',
  discount_value: '',
  start_date: '',
  end_date: '',
  quantity: 0,
  is_active: true,
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [form, setForm] = useState<VoucherForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    api.get<ApiResponse<Voucher[]>>('/admin/vouchers').then((res) => setVouchers(res.data.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      discount_value: Number(form.discount_value),
      quantity: Number(form.quantity),
    };
    try {
      if (editingId) {
        await api.put(`/admin/vouchers/${editingId}`, payload);
      } else {
        await api.post('/admin/vouchers', payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Có lỗi xảy ra'));
    }
  };

  const startEdit = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setForm({
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      start_date: voucher.start_date.slice(0, 10),
      end_date: voucher.end_date.slice(0, 10),
      quantity: voucher.quantity,
      is_active: !!voucher.is_active,
    });
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink mb-6">Quản lý voucher</h1>

      <form onSubmit={handleSubmit} className="hn-panel p-5 mb-6 grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl">
        <div>
          <label className="hn-label">Mã voucher</label>
          <input name="code" value={form.code} onChange={handleChange} required className="hn-input" />
        </div>
        <div>
          <label className="hn-label">Loại giảm giá</label>
          <select name="discount_type" value={form.discount_type} onChange={handleChange} className="hn-input">
            <option value="percent">Phần trăm (%)</option>
            <option value="amount">Số tiền (đ)</option>
          </select>
        </div>
        <div>
          <label className="hn-label">Giá trị</label>
          <input type="number" name="discount_value" value={form.discount_value} onChange={handleChange} required min="0" className="hn-input" />
        </div>
        <div>
          <label className="hn-label">Ngày bắt đầu</label>
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required className="hn-input" />
        </div>
        <div>
          <label className="hn-label">Ngày kết thúc</label>
          <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required className="hn-input" />
        </div>
        <div>
          <label className="hn-label">Số lượng</label>
          <input type="number" name="quantity" value={form.quantity} onChange={handleChange} min="0" className="hn-input" />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="accent-[var(--color-accent)]" />
          Đang hoạt động
        </label>

        {error && <p className="text-sm text-accent col-span-full">{error}</p>}

        <div className="col-span-full flex gap-2">
          <button type="submit" className="hn-btn hn-btn-sm">
            {editingId ? 'Cập nhật voucher' : 'Thêm voucher'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="hn-btn-outline hn-btn-sm"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      <div className="hn-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-beige/60 text-left text-xs uppercase tracking-[0.1em] text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Mã</th>
              <th className="px-4 py-3 font-medium">Loại</th>
              <th className="px-4 py-3 font-medium">Giá trị</th>
              <th className="px-4 py-3 font-medium">Hiệu lực</th>
              <th className="px-4 py-3 font-medium">Số lượng</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-t border-beige">
                <td className="px-4 py-2 font-medium text-ink font-mono">{v.code}</td>
                <td className="px-4 py-2 text-ink-soft">{v.discount_type === 'percent' ? 'Phần trăm' : 'Số tiền'}</td>
                <td className="px-4 py-2">{v.discount_type === 'percent' ? `${v.discount_value}%` : `${Number(v.discount_value).toLocaleString('vi-VN')}đ`}</td>
                <td className="px-4 py-2 text-ink-soft">
                  {formatDate(v.start_date).split(' ')[0]} - {formatDate(v.end_date).split(' ')[0]}
                </td>
                <td className="px-4 py-2">{v.quantity}</td>
                <td className="px-4 py-2">
                  {v.is_active ? (
                    <span className="hn-badge bg-emerald-100 text-emerald-700">Hoạt động</span>
                  ) : (
                    <span className="hn-badge bg-beige text-ink-soft">Tắt</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs uppercase tracking-wider">
                  <button onClick={() => startEdit(v)} className="text-ink hover:text-accent transition-colors">
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
