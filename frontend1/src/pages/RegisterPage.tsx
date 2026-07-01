import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <p className="hn-eyebrow">Tài khoản</p>
        <h1 className="hn-title">Đăng ký</h1>
      </div>
      <form onSubmit={handleSubmit} className="hn-panel p-7 space-y-4">
        <div>
          <label className="hn-label">Họ và tên</label>
          <input name="full_name" value={form.full_name} onChange={handleChange} required className="hn-input" />
        </div>
        <div>
          <label className="hn-label">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="hn-input" />
        </div>
        <div>
          <label className="hn-label">Mật khẩu</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} className="hn-input" />
        </div>
        <div>
          <label className="hn-label">Số điện thoại</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="hn-input" />
        </div>
        <div>
          <label className="hn-label">Địa chỉ</label>
          <input name="address" value={form.address} onChange={handleChange} className="hn-input" />
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button type="submit" disabled={submitting} className="hn-btn w-full">
          {submitting ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
        <p className="text-sm text-center text-ink-soft">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-accent hover:text-accent-dark underline underline-offset-2">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
