import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-24 sm:py-32">
      <p className="hn-eyebrow">Error 404</p>
      <h1 className="font-display text-ink font-medium leading-none mb-4" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
        404
      </h1>
      <p className="text-ink-soft font-light mb-8">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      <Link to="/" className="hn-btn">
        Về trang chủ <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}
