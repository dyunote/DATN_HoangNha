import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center py-20">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
