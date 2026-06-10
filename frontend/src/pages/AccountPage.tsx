import { useState, type FormEvent } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MEMBER_LEVEL_LABELS } from '../utils/format';
import { getErrorMessage } from '../utils/error';

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [profileMessage, setProfileMessage] = useState('');

  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });
  const [passwordMessage, setPasswordMessage] = useState('');

  if (!user) return null;

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMessage('');
    try {
      await api.put('/auth/me', profileForm);
      await refreshUser();
      setProfileMessage('Cập nhật thông tin thành công');
    } catch (err) {
      setProfileMessage(getErrorMessage(err, 'Có lỗi xảy ra'));
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage('');
    try {
      await api.put('/auth/me/password', passwordForm);
      setPasswordMessage('Đổi mật khẩu thành công');
      setPasswordForm({ old_password: '', new_password: '' });
    } catch (err) {
      setPasswordMessage(getErrorMessage(err, 'Có lỗi xảy ra'));
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Tài khoản của tôi</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 text-sm">
        <p>
          Email: <strong>{user.email}</strong>
        </p>
        <p>
          Hạng thành viên: <strong>{MEMBER_LEVEL_LABELS[user.member_level]}</strong>
        </p>
      </div>

      <form onSubmit={handleProfileSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
        <h2 className="font-semibold">Thông tin cá nhân</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Họ và tên</label>
          <input
            value={profileForm.full_name}
            onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
          <input
            value={profileForm.phone}
            onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Địa chỉ</label>
          <input
            value={profileForm.address}
            onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}
        <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">
          Lưu thay đổi
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Đổi mật khẩu</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={passwordForm.old_password}
            onChange={(e) => setPasswordForm((f) => ({ ...f, old_password: e.target.value }))}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
          <input
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        {passwordMessage && <p className="text-sm text-emerald-600">{passwordMessage}</p>}
        <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg text-sm">
          Đổi mật khẩu
        </button>
      </form>
    </div>
  );
}
