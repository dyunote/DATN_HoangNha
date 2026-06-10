import * as productModel from '../models/productModel';
import * as reviewModel from '../models/reviewModel';
import * as categoryModel from '../models/categoryModel';
import { AppError } from '../utils/response';

export const VALID_TABS = ['new', 'featured', 'bestseller'];
export const VALID_SORTS = ['price_asc', 'price_desc'];

interface ListFilters {
  category_id?: number | string;
  sort?: string;
  search?: string;
  tab?: string;
}

export const list = async ({ category_id, sort, search, tab }: ListFilters) => {
  if (tab && !VALID_TABS.includes(tab)) {
    throw new AppError('Tab khong hop le', 400);
  }
  if (sort && !VALID_SORTS.includes(sort)) {
    throw new AppError('Tham so sap xep khong hop le', 400);
  }
  return productModel.findAll({ category_id, sort, search, tab });
};

export const getById = async (id: number) => {
  const product = await productModel.findById(id);
  if (!product) throw new AppError('Khong tim thay san pham', 404);

  const rating = await reviewModel.getAverageRating(id);
  const reviews = await reviewModel.findByProduct(id);

  return { ...product, rating, reviews };
};

// ----- ADMIN -----
export const adminList = (filters: ListFilters) => productModel.findAll({ ...filters, includeHidden: true });

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
