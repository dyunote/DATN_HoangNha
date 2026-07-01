import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Hien thong bao khi vua dat lai mat khau xong (dieu huong tu ResetPasswordPage)
  const resetDone = (location.state as { resetDone?: boolean } | null)?.resetDone;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      const state = location.state as { from?: string } | null;
      const redirectTo = state?.from || (user.role === 'admin' ? '/admin' : '/');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng nhập thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <p className="hn-eyebrow">Tài khoản</p>
        <h1 className="hn-title">Đăng nhập</h1>
      </div>
      <form onSubmit={handleSubmit} className="hn-panel p-7 space-y-4">
        {resetDone && (
          <p className="text-sm text-emerald-600">Đặt lại mật khẩu thành công. Vui lòng đăng nhập.</p>
        )}
        <div>
          <label className="hn-label">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className="hn-input"
          />
        </div>
        <div>
          <label className="hn-label">Mật khẩu</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            className="hn-input"
          />
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs text-accent hover:text-accent-dark">
            Quên mật khẩu?
          </Link>
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button type="submit" disabled={submitting} className="hn-btn w-full">
          {submitting ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
        <p className="text-sm text-center text-ink-soft">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-accent hover:text-accent-dark underline underline-offset-2">
            Đăng ký
          </Link>
        </p>
      </form>
    </div>
  );
}
