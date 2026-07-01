import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatDate } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import PageHeader from '../components/PageHeader';
import type { ApiResponse, Voucher } from '../types';

const discountLabel = (v: Voucher) =>
  v.discount_type === 'percent' ? `Giảm ${Number(v.discount_value)}%` : `Giảm ${formatPrice(v.discount_value)}`;

function VoucherCard({
  v,
  onSave,
  saving,
}: {
  v: Voucher;
  onSave?: (v: Voucher) => void;
  saving?: boolean;
}) {
  const { success } = useToast();
  const copyCode = () => {
    navigator.clipboard?.writeText(v.code);
    success(`Đã sao chép mã ${v.code}`);
  };
  const expired = v.is_valid === false;

  return (
    <div className={`flex items-stretch border border-beige bg-white overflow-hidden ${expired ? 'opacity-60' : ''}`}>
      {/* Phan trai - bien dang ticket */}
      <div className="bg-accent text-cream flex flex-col items-center justify-center px-4 py-3 w-28 shrink-0">
        <span className="text-[10px] uppercase tracking-[0.15em]">Voucher</span>
        <span className="text-lg font-semibold leading-tight text-center font-display">{discountLabel(v)}</span>
      </div>
      {/* Phan phai - thong tin */}
      <div className="flex-1 p-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-ink">{v.code}</span>
          <button onClick={copyCode} className="text-xs text-accent hover:text-accent-dark">Sao chép</button>
        </div>
        <p className="text-xs text-ink-soft mt-1">
          {Number(v.min_order_amount) > 0 ? `Đơn tối thiểu ${formatPrice(v.min_order_amount)}` : 'Áp dụng mọi đơn'}
        </p>
        <p className="text-xs text-ink-soft/70">HSD: {formatDate(v.end_date)}</p>
        {expired && <p className="text-xs text-accent mt-1">Đã hết hạn / hết lượt</p>}
      </div>
      {/* Hanh dong */}
      {onSave && (
        <div className="flex items-center pr-3">
          {v.saved ? (
            <span className="text-xs uppercase tracking-wider text-emerald-600 font-medium">Đã lưu</span>
          ) : (
            <button
              onClick={() => onSave(v)}
              disabled={saving || expired}
              className="hn-btn hn-btn-sm"
            >
              Lưu
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function VouchersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [available, setAvailable] = useState<Voucher[]>([]);
  const [mine, setMine] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const reqs: Promise<unknown>[] = [
        api.get<ApiResponse<Voucher[]>>('/vouchers/available').then((r) => setAvailable(r.data.data)),
      ];
      if (user) {
        reqs.push(api.get<ApiResponse<Voucher[]>>('/vouchers/mine').then((r) => setMine(r.data.data)));
      } else {
        setMine([]);
      }
      await Promise.all(reqs);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (v: Voucher) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu voucher');
      return;
    }
    setSavingCode(v.code);
    try {
      await api.post('/vouchers/save', { code: v.code });
      toast.success(`Đã lưu voucher ${v.code}`);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lưu voucher thất bại'));
    } finally {
      setSavingCode('');
    }
  };

  if (loading) return <p className="text-ink-soft">Đang tải...</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Ưu đãi" title="Kho voucher" />

      {/* Voucher cua toi */}
      <section className="mb-10">
        <h2 className="text-sm uppercase tracking-[0.18em] text-ink mb-4">Voucher của tôi</h2>
        {!user ? (
          <p className="text-sm text-ink-soft">
            <Link to="/login" className="text-accent hover:text-accent-dark underline underline-offset-2">Đăng nhập</Link> để lưu và xem voucher của bạn.
          </p>
        ) : mine.length === 0 ? (
          <p className="text-sm text-ink-soft">Bạn chưa lưu voucher nào. Lưu ngay ở danh sách bên dưới nhé!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mine.map((v) => (
              <VoucherCard key={v.id} v={v} />
            ))}
          </div>
        )}
        {user && mine.length > 0 && (
          <p className="text-xs text-ink-soft mt-3">
            Dùng voucher bằng cách nhập mã ở trang <Link to="/cart" className="text-accent hover:text-accent-dark underline underline-offset-2">giỏ hàng</Link>.
          </p>
        )}
      </section>

      {/* Voucher co the luu */}
      <section>
        <h2 className="text-sm uppercase tracking-[0.18em] text-ink mb-4">Voucher đang phát hành</h2>
        {available.length === 0 ? (
          <p className="text-sm text-ink-soft">Hiện chưa có voucher nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {available.map((v) => (
              <VoucherCard key={v.id} v={v} onSave={handleSave} saving={savingCode === v.code} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
