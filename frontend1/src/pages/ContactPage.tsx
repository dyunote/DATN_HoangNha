import { useState, type FormEvent } from 'react';
import InfoPage from './InfoPage';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Demo: chua noi backend gui mail. Hien thong bao da nhan.
    setSent(true);
  };

  return (
    <InfoPage eyebrow="Liên hệ" title="Liên hệ với Hoàng Nha">
      <p>
        Hotline: <a href="tel:0979026169" className="text-accent hover:text-accent-dark">0979 026 169</a> ·
        Email: <a href="mailto:hello@hoangnha.com" className="text-accent hover:text-accent-dark">hello@hoangnha.com</a>
      </p>
      {sent ? (
        <p className="text-emerald-600">Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm nhất.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 not-prose">
          <div>
            <label className="hn-label">Họ và tên</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="hn-input" />
          </div>
          <div>
            <label className="hn-label">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="hn-input" />
          </div>
          <div>
            <label className="hn-label">Nội dung</label>
            <textarea required rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className="hn-input" />
          </div>
          <button type="submit" className="hn-btn hn-btn-sm">Gửi liên hệ</button>
        </form>
      )}
    </InfoPage>
  );
}
