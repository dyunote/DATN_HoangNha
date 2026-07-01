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
      <h1 className="font-display text-2xl font-medium text-ink mb-6">Quản lý người dùng</h1>

      {loading ? (
        <p className="text-ink-soft">Đang tải...</p>
      ) : (
        <div className="hn-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/60 text-left text-xs uppercase tracking-[0.1em] text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">SĐT</th>
                <th className="px-4 py-3 font-medium">Hạng thành viên</th>
                <th className="px-4 py-3 font-medium">Vai trò</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-beige">
                  <td className="px-4 py-2 font-medium text-ink">{u.full_name}</td>
                  <td className="px-4 py-2 text-ink-soft">{u.email}</td>
                  <td className="px-4 py-2 text-ink-soft">{u.phone}</td>
                  <td className="px-4 py-2">{MEMBER_LEVEL_LABELS[u.member_level]}</td>
                  <td className="px-4 py-2">{u.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</td>
                  <td className="px-4 py-2 text-ink-soft">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-2">
                    {u.is_locked ? (
                      <span className="hn-badge bg-accent/10 text-accent-dark">Đã khóa</span>
                    ) : (
                      <span className="hn-badge bg-emerald-100 text-emerald-700">Hoạt động</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs uppercase tracking-wider">
                    {u.role !== 'admin' && (
                      <button onClick={() => toggleLock(u)} className="text-ink-soft hover:text-accent transition-colors">
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
