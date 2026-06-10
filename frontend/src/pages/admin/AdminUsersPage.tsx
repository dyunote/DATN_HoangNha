import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatDate, MEMBER_LEVEL_LABELS } from '../../utils/format';
import type { ApiResponse, User } from '../../types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get<ApiResponse<User[]>>('/admin/users')
      .then((res) => setUsers(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleLock = async (user: User) => {
    await api.patch(`/admin/users/${user.id}/lock`, { is_locked: !user.is_locked });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quản lý người dùng</h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Họ tên</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">SĐT</th>
                <th className="px-4 py-2">Hạng thành viên</th>
                <th className="px-4 py-2">Vai trò</th>
                <th className="px-4 py-2">Ngày tạo</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium">{u.full_name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.phone}</td>
                  <td className="px-4 py-2">{MEMBER_LEVEL_LABELS[u.member_level]}</td>
                  <td className="px-4 py-2">{u.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</td>
                  <td className="px-4 py-2">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-2">
                    {u.is_locked ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700">Đã khóa</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Hoạt động</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {u.role !== 'admin' && (
                      <button onClick={() => toggleLock(u)} className="text-amber-600 hover:underline">
                        {u.is_locked ? 'Mở khóa' : 'Khóa'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
