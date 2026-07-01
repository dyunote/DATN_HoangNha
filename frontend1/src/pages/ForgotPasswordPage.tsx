import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getErrorMessage } from '../utils/error';
import type { ApiResponse } from '../types';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
      // Backend luon tra ve thong bao chung (khong tiet lo email co ton tai)
      setMessage(res.data.message);
    } catch (err) {
      setError(getErrorMessage(err, 'Có lỗi xảy ra'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <p className="hn-eyebrow">Tài khoản</p>
        <h1 className="hn-title">Quên mật khẩu</h1>
      </div>
      <form onSubmit={handleSubmit} className="hn-panel p-7 space-y-4">
        {message ? (
          <p className="text-sm text-emerald-600">{message}</p>
        ) : (
          <>
            <p className="text-sm text-ink-soft">
              Nhập email đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu vào hộp thư của bạn.
            </p>
            <div>
              <label className="hn-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="hn-input"
              />
            </div>
            {error && <p className="text-sm text-accent">{error}</p>}
            <button type="submit" disabled={submitting} className="hn-btn w-full">
              {submitting ? 'Đang gửi...' : 'Gửi link đặt lại'}
            </button>
          </>
        )}
        <p className="text-sm text-center text-ink-soft">
          <Link to="/login" className="text-accent hover:text-accent-dark underline underline-offset-2">
            Quay lại đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
