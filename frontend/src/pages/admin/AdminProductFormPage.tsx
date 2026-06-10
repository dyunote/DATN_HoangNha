import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/error';
import type { ApiResponse, Category, ProductDetail } from '../../types';

interface ImageForm {
  image_url: string;
  is_main: boolean;
}

interface VariantForm {
  size: string;
  color: string;
  stock: number | string;
}

const emptyImage = (): ImageForm => ({ image_url: '', is_main: false });
const emptyVariant = (): VariantForm => ({ size: '', color: '', stock: 0 });

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    is_featured: false,
    is_new: false,
  });
  const [images, setImages] = useState<ImageForm[]>([emptyImage()]);
  const [variants, setVariants] = useState<VariantForm[]>([emptyVariant()]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<Category[]>>('/admin/categories').then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get<ApiResponse<ProductDetail>>(`/admin/products/${id}`).then((res) => {
      const p = res.data.data;
      setForm({
        category_id: String(p.category_id),
        name: p.name,
        description: p.description || '',
        price: String(p.price),
        is_featured: !!p.is_featured,
        is_new: !!p.is_new,
      });
      setImages(p.images.length ? p.images.map((i) => ({ image_url: i.image_url, is_main: !!i.is_main })) : [emptyImage()]);
      setVariants(p.variants.length ? p.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock })) : [emptyVariant()]);
    });
  }, [id, isEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const updateImage = <K extends keyof ImageForm>(index: number, field: K, value: ImageForm[K]) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, [field]: value } : img)));
  };

  const updateVariant = <K extends keyof VariantForm>(index: number, field: K, value: VariantForm[K]) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      ...form,
      category_id: Number(form.category_id),
      price: Number(form.price),
      images: images.filter((img) => img.image_url.trim()),
      variants: variants
        .filter((v) => v.size.trim() && v.color.trim())
        .map((v) => ({ ...v, stock: Number(v.stock) || 0 })),
    };

    try {
      if (isEdit) {
        await api.put(`/admin/products/${id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(getErrorMessage(err, 'Có lỗi xảy ra'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
        <Link to="/admin/products" className="text-sm text-rose-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Danh mục</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giá (đ)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              min="0"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} />
            Sản phẩm nổi bật
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} />
            Sản phẩm mới
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Hình ảnh</label>
            <button type="button" onClick={() => setImages((prev) => [...prev, emptyImage()])} className="text-sm text-rose-600 hover:underline">
              + Thêm ảnh
            </button>
          </div>
          <div className="space-y-2">
            {images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={img.image_url}
                  onChange={(e) => updateImage(i, 'image_url', e.target.value)}
                  placeholder="URL hình ảnh"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input type="checkbox" checked={img.is_main} onChange={(e) => updateImage(i, 'is_main', e.target.checked)} />
                  Ảnh chính
                </label>
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} className="text-rose-600 text-sm">
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Biến thể (Size / Màu / Tồn kho)</label>
            <button type="button" onClick={() => setVariants((prev) => [...prev, emptyVariant()])} className="text-sm text-rose-600 hover:underline">
              + Thêm biến thể
            </button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={v.size}
                  onChange={(e) => updateVariant(i, 'size', e.target.value)}
                  placeholder="Size (S, M, L...)"
                  className="w-1/3 border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={v.color}
                  onChange={(e) => updateVariant(i, 'color', e.target.value)}
                  placeholder="Màu sắc"
                  className="w-1/3 border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                  placeholder="Tồn kho"
                  min="0"
                  className="w-1/4 border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <button type="button" onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))} className="text-rose-600 text-sm">
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button type="submit" disabled={submitting} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-60">
          {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        </button>
      </form>
    </div>
  );
}
