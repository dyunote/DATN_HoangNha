import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-gray-500 mb-4">Trang bạn tìm không tồn tại.</p>
      <Link to="/" className="text-rose-600 hover:underline">
        Về trang chủ
      </Link>
    </div>
  );
}
