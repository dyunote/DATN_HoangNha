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

  // Tai file anh len server -> nhan ve URL roi dien vao o image_url cua dong tuong ung
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const handleUpload = async (index: number, file: File) => {
    setError('');
    setUploadingIndex(index);
    const fd = new FormData();
    fd.append('file', file); // field name phai trung voi backend: uploadImage.single('file')
    try {
      const res = await api.post<ApiResponse<{ url: string }>>('/admin/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateImage(index, 'image_url', res.data.data.url);
    } catch (err) {
      setError(getErrorMessage(err, 'Tải ảnh thất bại'));
    } finally {
      setUploadingIndex(null);
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
        <Link to="/admin/products" className="text-xs uppercase tracking-wider text-accent hover:text-accent-dark">
          &larr; Quay lại danh sách
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="hn-panel p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="hn-label">Danh mục</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} required className="hn-input">
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="hn-label">Giá (đ)</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" className="hn-input" />
          </div>
        </div>

        <div>
          <label className="hn-label">Tên sản phẩm</label>
          <input name="name" value={form.name} onChange={handleChange} required className="hn-input" />
        </div>

        <div>
          <label className="hn-label">Mô tả</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="hn-input" />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="is_new" checked={form.is_new} onChange={handleChange} className="accent-[var(--color-accent)]" />
            Sản phẩm mới
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="hn-label mb-0">Hình ảnh</label>
            <button type="button" onClick={() => setImages((prev) => [...prev, emptyImage()])} className="text-xs uppercase tracking-wider text-accent hover:text-accent-dark">
              + Thêm ảnh
            </button>
          </div>
          <div className="space-y-2">
            {images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* Anh xem truoc (neu da co URL) */}
                {img.image_url ? (
                  <img src={img.image_url} alt="" loading="lazy" className="w-12 h-14 object-cover bg-beige shrink-0 border border-beige" />
                ) : (
                  <div className="w-12 h-14 bg-beige shrink-0 flex items-center justify-center text-[10px] text-ink-soft">No img</div>
                )}
                <input
                  type="text"
                  value={img.image_url}
                  onChange={(e) => updateImage(i, 'image_url', e.target.value)}
                  placeholder="URL hình ảnh hoặc chọn file để tải lên"
                  className="hn-input flex-1"
                />
                {/* Nut chon file -> upload */}
                <label className="hn-btn-outline hn-btn-sm cursor-pointer whitespace-nowrap">
                  {uploadingIndex === i ? 'Đang tải...' : 'Tải ảnh'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingIndex !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(i, file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <label className="flex items-center gap-1 text-xs whitespace-nowrap text-ink-soft">
                  <input type="checkbox" checked={img.is_main} onChange={(e) => updateImage(i, 'is_main', e.target.checked)} className="accent-[var(--color-accent)]" />
                  Ảnh chính
                </label>
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-600 hover:text-red-700 text-xs uppercase tracking-wider">
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="hn-label mb-0">Biến thể (Size / Màu / Tồn kho)</label>
            <button type="button" onClick={() => setVariants((prev) => [...prev, emptyVariant()])} className="text-xs uppercase tracking-wider text-accent hover:text-accent-dark">
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
                  className="hn-input flex-1"
                />
                <input
                  type="text"
                  value={v.color}
                  onChange={(e) => updateVariant(i, 'color', e.target.value)}
                  placeholder="Màu sắc"
                  className="hn-input flex-1"
                />
                <input
                  type="number"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                  placeholder="Tồn kho"
                  min="0"
                  className="hn-input"
                  style={{ width: '6.5rem', flex: 'none' }}
                />
                <button type="button" onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-600 hover:text-red-700 text-xs uppercase tracking-wider">
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-accent">{error}</p>}

        <button type="submit" disabled={submitting} className="hn-btn">
          {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        </button>
      </form>
    </div>
  );
}
