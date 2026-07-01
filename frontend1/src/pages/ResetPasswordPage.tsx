import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { getErrorMessage } from '../utils/error';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Khong co token -> link sai
  if (!token) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="hn-title mb-3">Link không hợp lệ</h1>
        <p className="text-ink-soft mb-6">Thiếu mã đặt lại mật khẩu. Vui lòng yêu cầu lại.</p>
        <Link to="/forgot-password" className="hn-btn">Quên mật khẩu</Link>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      // Xong -> ve trang dang nhap
      navigate('/login', { replace: true, state: { resetDone: true } });
    } catch (err) {
      setError(getErrorMessage(err, 'Đặt lại mật khẩu thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <p className="hn-eyebrow">Tài khoản</p>
        <h1 className="hn-title">Đặt lại mật khẩu</h1>
      </div>
      <form onSubmit={handleSubmit} className="hn-panel p-7 space-y-4">
        <div>
          <label className="hn-label">Mật khẩu mới</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="hn-input"
          />
        </div>
        <div>
          <label className="hn-label">Nhập lại mật khẩu mới</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            className="hn-input"
          />
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button type="submit" disabled={submitting} className="hn-btn w-full">
          {submitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </div>
  );
}
