import { useEffect, useState, type FormEvent } from 'react';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/error';
import type { ApiResponse, Category } from '../../types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api.get<ApiResponse<Category[]>>('/admin/categories').then((res) => setCategories(res.data.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return;
    try {
      await api.post('/admin/categories', { name });
      setName('');
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Có lỗi xảy ra'));
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const saveEdit = async (category: Category) => {
    await api.put(`/admin/categories/${category.id}`, { name: editingName, is_hidden: !!category.is_hidden });
    setEditingId(null);
    load();
  };

  const toggleHidden = async (category: Category) => {
    await api.patch(`/admin/categories/${category.id}/hidden`, { is_hidden: !category.is_hidden });
    load();
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-medium text-ink mb-6">Quản lý danh mục</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên danh mục mới"
          className="hn-input flex-1"
        />
        <button type="submit" className="hn-btn hn-btn-sm">
          Thêm
        </button>
      </form>
      {error && <p className="text-sm text-accent mb-2">{error}</p>}

      <div className="hn-panel divide-y divide-beige">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            {editingId === c.id ? (
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="hn-input flex-1 mr-2"
              />
            ) : (
              <span className={c.is_hidden ? 'text-ink-soft/60' : 'text-ink'}>{c.name}</span>
            )}
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider">
              {c.is_hidden && <span className="hn-badge bg-beige text-ink-soft">Đã ẩn</span>}
              {editingId === c.id ? (
                <button onClick={() => saveEdit(c)} className="text-emerald-600 hover:text-emerald-700 transition-colors">
                  Lưu
                </button>
              ) : (
                <button onClick={() => startEdit(c)} className="text-ink hover:text-accent transition-colors">
                  Sửa
                </button>
              )}
              <button onClick={() => toggleHidden(c)} className="text-ink-soft hover:text-accent transition-colors">
                {c.is_hidden ? 'Hiện' : 'Ẩn'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
