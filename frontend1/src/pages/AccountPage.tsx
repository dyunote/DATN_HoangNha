import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  MEMBER_LEVEL_LABELS,
  formatDate,
  formatPrice,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from '../utils/format';
import { getErrorMessage } from '../utils/error';
import PageHeader from '../components/PageHeader';
import type { Address, ApiResponse, Order, ProvinceListData } from '../types';

// Ba tab cua trang tai khoan
type TabKey = 'profile' | 'addresses' | 'orders';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Thông tin tài khoản' },
  { key: 'addresses', label: 'Sổ địa chỉ' },
  { key: 'orders', label: 'Đơn hàng của tôi' },
];

export default function AccountPage() {
  const { user } = useAuth();

  // Tab hien tai dong bo voi query ?tab=... de chia se / reload giu nguyen
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabKey = tabParam === 'orders' || tabParam === 'addresses' ? tabParam : 'profile';

  const setTab = (key: TabKey) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'profile') next.delete('tab');
    else next.set('tab', key);
    setSearchParams(next);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Tài khoản" title="Tài khoản của tôi" />

      {/* Thanh chuyen tab */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`hn-tab ${activeTab === t.key ? 'hn-tab-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'addresses' && <AddressesTab />}
      {activeTab === 'orders' && <OrdersTab />}
    </div>
  );
}

/* ===================== TAB THONG TIN TAI KHOAN ===================== */
function ProfileTab() {
  const { user, refreshUser } = useAuth();

  // Mac dinh chi xem; bam "Sua" moi cho chinh sua (giong Shopee)
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [saving, setSaving] = useState(false);

  // Doi mat khau: an trong, bam moi hien form
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!user) return null;

  const startEdit = () => {
    setProfileForm({ full_name: user.full_name || '', phone: user.phone || '', address: user.address || '' });
    setProfileMessage('');
    setProfileError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setProfileForm({ full_name: user.full_name || '', phone: user.phone || '', address: user.address || '' });
    setProfileError('');
    setEditing(false);
  };

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setSaving(true);
    try {
      await api.put('/auth/me', profileForm);
      await refreshUser();
      setProfileMessage('Cập nhật thông tin thành công');
      setEditing(false);
    } catch (err) {
      setProfileError(getErrorMessage(err, 'Có lỗi xảy ra'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    try {
      await api.put('/auth/me/password', passwordForm);
      setPasswordMessage('Đổi mật khẩu thành công');
      setPasswordForm({ old_password: '', new_password: '' });
      setChangingPassword(false);
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Có lỗi xảy ra'));
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-beige last:border-0">
      <span className="text-xs uppercase tracking-[0.12em] text-ink-soft w-40 shrink-0">{label}</span>
      <span className="text-sm text-ink">{value || <span className="text-ink-soft/60">Chưa cập nhật</span>}</span>
    </div>
  );

  return (
    <>
      <div className="hn-panel p-5 mb-4 text-sm space-y-1">
        <p className="text-ink-soft">
          Email: <strong className="text-ink font-medium">{user.email}</strong>
        </p>
        <p className="text-ink-soft">
          Hạng thành viên: <strong className="text-ink font-medium">{MEMBER_LEVEL_LABELS[user.member_level]}</strong>
        </p>
      </div>

      {/* ---------- THONG TIN CA NHAN ---------- */}
      <div className="hn-panel p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm uppercase tracking-[0.18em] text-ink">Thông tin cá nhân</h2>
          {!editing && (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-accent hover:text-accent-dark font-medium"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 20h9" strokeLinecap="round" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" strokeLinejoin="round" />
              </svg>
              Sửa
            </button>
          )}
        </div>

        {!editing ? (
          <>
            <InfoRow label="Họ và tên" value={user.full_name} />
            <InfoRow label="Số điện thoại" value={user.phone || ''} />
            <InfoRow label="Địa chỉ" value={user.address || ''} />
            {profileMessage && <p className="text-sm text-emerald-600 mt-3">{profileMessage}</p>}
          </>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div>
              <label className="hn-label">Họ và tên</label>
              <input
                value={profileForm.full_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
                required
                className="hn-input"
              />
            </div>
            <div>
              <label className="hn-label">Số điện thoại</label>
              <input
                value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                className="hn-input"
              />
            </div>
            <div>
              <label className="hn-label">Địa chỉ</label>
              <input
                value={profileForm.address}
                onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
                className="hn-input"
              />
            </div>
            {profileError && <p className="text-sm text-accent">{profileError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="hn-btn hn-btn-sm">
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button type="button" onClick={cancelEdit} className="hn-btn-outline hn-btn-sm">
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ---------- DOI MAT KHAU ---------- */}
      <div className="hn-panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-[0.18em] text-ink">Đổi mật khẩu</h2>
          {!changingPassword && (
            <button
              onClick={() => {
                setPasswordForm({ old_password: '', new_password: '' });
                setPasswordMessage('');
                setPasswordError('');
                setChangingPassword(true);
              }}
              className="text-xs uppercase tracking-wider text-accent hover:text-accent-dark font-medium"
            >
              Đổi mật khẩu
            </button>
          )}
        </div>

        {passwordMessage && !changingPassword && <p className="text-sm text-emerald-600 mt-2">{passwordMessage}</p>}

        {changingPassword && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3 mt-4">
            <div>
              <label className="hn-label">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={passwordForm.old_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, old_password: e.target.value }))}
                required
                className="hn-input"
              />
            </div>
            <div>
              <label className="hn-label">Mật khẩu mới</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                required
                minLength={6}
                className="hn-input"
              />
            </div>
            {passwordError && <p className="text-sm text-accent">{passwordError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="hn-btn-dark hn-btn-sm">
                Đổi mật khẩu
              </button>
              <button
                type="button"
                onClick={() => {
                  setChangingPassword(false);
                  setPasswordError('');
                }}
                className="hn-btn-outline hn-btn-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

/* ===================== TAB SO DIA CHI ===================== */

// Form them/sua 1 dia chi. addressToEdit = null nghia la dang them moi.
const EMPTY_ADDRESS_FORM = { receiver_name: '', phone: '', province: '', address: '', is_default: false };

function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [provinceData, setProvinceData] = useState<ProvinceListData | null>(null);
  const [loading, setLoading] = useState(true);

  // null = dong form; 'new' = them moi; number = dang sua id do
  const [editing, setEditing] = useState<'new' | number | null>(null);
  const [form, setForm] = useState(EMPTY_ADDRESS_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAddresses = () => {
    setLoading(true);
    api
      .get<ApiResponse<Address[]>>('/addresses')
      .then((res) => setAddresses(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAddresses();
    api
      .get<ApiResponse<ProvinceListData>>('/shipping/provinces')
      .then((res) => setProvinceData(res.data.data))
      .catch(() => setProvinceData(null));
  }, []);

  const startCreate = () => {
    setForm(EMPTY_ADDRESS_FORM);
    setFormError('');
    setEditing('new');
  };

  const startEdit = (addr: Address) => {
    setFor