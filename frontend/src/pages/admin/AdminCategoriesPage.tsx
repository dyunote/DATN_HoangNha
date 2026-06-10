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
      <h1 className="text-2xl font-bold mb-4">Quản lý danh mục</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên danh mục mới"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">
          Thêm
        </button>
      </form>
      {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            {editingId === c.id ? (
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 mr-2"
              />
            ) : (
              <span className={c.is_hidden ? 'text-gray-400' : ''}>{c.name}</span>
            )}
            <div className="flex items-center gap-3 text-sm">
              {c.is_hidden && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Đã ẩn</span>}
              {editingId === c.id ? (
                <button onClick={() => saveEdit(c)} className="text-emerald-600 hover:underline">
                  Lưu
                </button>
              ) : (
                <button onClick={() => startEdit(c)} className="text-blue-600 hover:underline">
                  Sửa
                </button>
              )}
              <button onClick={() => toggleHidden(c)} className="text-amber-600 hover:underline">
                {c.is_hidden ? 'Hiện' : 'Ẩn'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
