import * as productModel from '../models/productModel';
import * as reviewModel from '../models/reviewModel';
import * as wishlistModel from '../models/wishlistModel';
import * as categoryModel from '../models/categoryModel';
import { AppError } from '../utils/response';

export const VALID_TABS = ['new', 'bestseller', 'mostliked', 'featured'];
export const VALID_SORTS = ['price_asc', 'price_desc', 'likes'];

interface ListFilters {
  category_id?: number | string;
  sort?: string;
  search?: string;
  tab?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export const list = async ({ category_id, sort, search, tab }: ListFilters, userId?: number) => {
  if (tab && !VALID_TABS.includes(tab)) {
    throw new AppError('Tab khong hop le', 400);
  }
  if (sort && !VALID_SORTS.includes(sort)) {
    throw new AppError('Tham so sap xep khong hop le', 400);
  }
  const products = await productModel.findAll({ category_id, sort, search, tab });
  if (userId) {
    const wished = await wishlistModel.productIdsByUser(userId);
    products.forEach((p) => {
      p.is_wished = wished.has(p.id);
    });
  }
  return products;
};

// Danh sach co phan trang (tra ve kem tong so de hien thi so trang)
export const listPaged = async (filters: ListFilters, userId?: number) => {
  if (filters.tab && !VALID_TABS.includes(filters.tab)) {
    throw new AppError('Tab khong hop le', 400);
  }
  if (filters.sort && !VALID_SORTS.includes(filters.sort)) {
    throw new AppError('Tham so sap xep khong hop le', 400);
  }
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(filters.limit) || 12));

  const [items, total] = await Promise.all([
    productModel.findAll({ ...filters, page, limit }),
    productModel.count(filters),
  ]);

  if (userId) {
    const wished = await wishlistModel.productIdsByUser(userId);
    items.forEach((p) => {
      p.is_wished = wished.has(p.id);
    });
  }

  return { items, total, page, limit, total_pages: Math.max(1, Math.ceil(total / limit)) };
};

export const getById = async (id: number, userId?: number) => {
  const product = await productModel.findById(id);
  if (!product) throw new AppError('Khong tim thay san pham', 404);

  const rating = await reviewModel.getAverageRating(id);
  const reviews = await reviewModel.findByProduct(id);
  const is_wished = userId ? Boolean(await wishlistModel.exists(userId, id)) : false;

  return { ...product, rating, reviews, is_wished };
};

// ----- ADMIN -----
export const adminList = (filters: ListFilters) => productModel.findAll({ ...filters, includeHidden: true });

// Danh sach admin co phan trang (bao gom ca san pham da an)
export const adminListPaged = async (filters: ListFilters) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
  // includeHidden = true: trang quan tri xem ca san pham da an
  const opts = { ...filters, includeHidden: true };

  const [items, total] = await Promise.all([
    productModel.findAll({ ...opts, page, limit }),
    productModel.count(opts),
  ]);

  return { items, total, page, limit, total_pages: Math.max(1, Math.ceil(total / limit)) };
};

export const adminGetById = async (id: number) => {
  const product = await productModel.findById(id, { includeHidden: true });
  if (!product) throw new AppError('Khong tim thay san pham', 404);
  return product;
};

type ProductPayload = Parameters<typeof productModel.create>[0];

export const validateProductInput = async ({
  category_id,
  name,
  price,
}: Pick<ProductPayload, 'category_id' | 'name' | 'price'>) => {
  if (!category_id || !name || price === undefined || price === null) {
    throw new AppError('Vui long nhap day du danh muc, ten va gia san pham', 400);
  }
  if (Number(price) < 0) {
    throw new AppError('Gia san pham khong hop le', 400);
  }
  const category = await categoryModel.findById(category_id);
  if (!category) throw new AppError('Danh muc khong ton tai', 400);
};

export const create = async (payload: ProductPayload) => {
  await validateProductInput(payload);
  const id = await productModel.create(payload);
  return adminGetById(id);
};

export const update = async (id: number, payload: Partial<ProductPayload>) => {
  await adminGetById(id);
  await validateProductInput(payload as Pick<ProductPayload, 'category_id' | 'name' | 'price'>);
  await productModel.update(id, payload);
  return adminGetById(id);
};

export const setHidden = async (id: number, isHidden: boolean) => {
  await adminGetById(id);
  await productModel.setHidden(id, isHidden);
  return adminGetById(id);
};

export const remove = async (id: number) => {
  await adminGetById(id);
  await productModel.remove(id);
};
