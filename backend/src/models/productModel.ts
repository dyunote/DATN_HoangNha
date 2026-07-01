import { ResultSetHeader } from 'mysql2';
import pool from '../config/db';
import { ProductImageRow, ProductRow, ProductVariantRow, TopProductRow, VariantWithProductRow } from '../types';

interface FindAllOptions {
  category_id?: number | string;
  sort?: string;
  search?: string;
  tab?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

// Dung chung de build dieu kien WHERE cho findAll & count
const buildWhere = ({ category_id, search, tab, min_price, max_price, includeHidden }: FindAllOptions) => {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (!includeHidden) where.push('p.is_hidden = 0');
  if (category_id) {
    where.push('p.category_id = ?');
    params.push(category_id);
  }
  if (search) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (tab === 'new') where.push('p.is_new = 1');
  else if (tab === 'bestseller') where.push('p.sold_count > 0');
  if (min_price !== undefined && !Number.isNaN(min_price)) {
    where.push('p.price >= ?');
    params.push(min_price);
  }
  if (max_price !== undefined && !Number.isNaN(max_price)) {
    where.push('p.price <= ?');
    params.push(max_price);
  }

  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
};

// Dem tong so san pham khop dieu kien (cho phan trang)
export const count = async (opts: FindAllOptions) => {
  const { whereSql, params } = buildWhere(opts);
  const [[row]] = await pool.query<(ProductRow & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM products p ${whereSql}`,
    params
  );
  return Number(row.total);
};

// Lay danh sach san pham co loc, sap xep, tim kiem, phan trang
export const findAll = async (opts: FindAllOptions) => {
  const { sort, tab, page, limit } = opts;
  const { whereSql, params } = buildWhere(opts);

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  if (sort === 'price_desc') orderBy = 'p.price DESC';
  if (sort === 'likes') orderBy = 'like_count DESC, p.created_at DESC';
  if (tab === 'bestseller') orderBy = 'p.sold_count DESC';
  if (tab === 'mostliked') orderBy = 'like_count DESC, p.created_at DESC';
  // "Bo suu tap / San pham noi bat": uu tien ban chay, moi nhat lam phu.
  // Khong them dieu kien WHERE de luon co hang hien thi.
  if (tab === 'featured') orderBy = 'p.sold_count DESC, p.created_at DESC';

  let limitSql = '';
  const limitParams: number[] = [];
  if (page && limit) {
    limitSql = 'LIMIT ? OFFSET ?';
    limitParams.push(limit, (page - 1) * limit);
  }

  const sql = `
    SELECT p.*, c.name AS category_name,
      (SELECT COUNT(*) FROM wishlists w WHERE w.product_id = p.id) AS like_count,
      (SELECT COALESCE(SUM(pv.stock), 0) FROM product_variants pv WHERE pv.product_id = p.id) AS total_stock,
      (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC, pi.id ASC LIMIT 1) AS main_image
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereSql}
    ORDER BY ${orderBy}
    ${limitSql}
  `;

  const [rows] = await pool.query<ProductRow[]>(sql, [...params, ...limitParams]);
  return rows;
};

export const findById = async (id: number, { includeHidden = false }: { includeHidden?: boolean } = {}) => {
  const where = includeHidden ? 'p.id = ?' : 'p.id = ? AND p.is_hidden = 0';
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT p.*, c.name AS category_name,
      (SELECT COUNT(*) FROM wishlists w WHERE w.product_id = p.id) AS like_count
     FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where}`,
    [id]
  );
  const product = rows[0];
  if (!product) return null;

  const [images] = await pool.query<ProductImageRow[]>(
    'SELECT id, image_url, is_main FROM product_images WHERE product_id = ? ORDER BY is_main DESC, id ASC',
    [id]
  );
  const [variants] = await pool.query<ProductVariantRow[]>(
    'SELECT id, size, color, stock FROM product_variants WHERE product_id = ? ORDER BY id ASC',
    [id]
  );

  product.images = images;
  product.variants = variants;
  return product;
};

interface ProductImageInput {
  image_url: string;
  is_main?: boolean | number;
}

interface ProductVariantInput {
  size: string;
  color: string;
  stock?: number;
}

interface ProductInput {
  category_id: number;
  name: string;
  description?: string | null;
  price: number;
  is_new?: boolean | number;
  images?: ProductImageInput[];
  variants?: ProductVariantInput[];
}

export const create = async ({
  category_id,
  name,
  description,
  price,
  is_new,
  images = [],
  variants = [],
}: ProductInput) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query<ResultSetHeader>(
      'INSERT INTO products (category_id, name, description, price, is_new) VALUES (?, ?, ?, ?, ?)',
      [category_id, name, description || null, price, is_new ? 1 : 0]
    );
    const productId = result.insertId;

    for (const img of images) {
      await conn.query('INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)', [
        productId,
        img.image_url,
        img.is_main ? 1 : 0,
      ]);
    }

    for (const variant of variants) {
      await conn.query('INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)', [
        productId,
        variant.size,
        variant.color,
        variant.stock || 0,
      ]);
    }

    await conn.commit();
    return productId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const update = async (
  id: number,
  { category_id, name, description, price, is_new, images, variants }: Partial<ProductInput>
) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, is_new = ? WHERE id = ?',
      [category_id, name, description || null, price, is_new ? 1 : 0, id]
    );

    if (Array.isArray(images)) {
      await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
      for (const img of images) {
        await conn.query('INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)', [
          id,
          img.image_url,
          img.is_main ? 1 : 0,
        ]);
      }
    }

    if (Array.isArray(variants)) {
      await conn.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
      for (const variant of variants) {
        await conn.query('INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)', [
          id,
          variant.size,
          variant.color,
          variant.stock || 0,
        ]);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const setHidden = async (id: number, isHidden: boolean) => {
  await pool.query('UPDATE products SET is_hidden = ? WHERE id = ?', [isHidden ? 1 : 0, id]);
};

export const remove = async (id: number) => {
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
};

export const findVariantById = async (variantId: number) => {
  const [rows] = await pool.query<VariantWithProductRow[]>(
    `SELECT pv.*, p.name AS product_name, p.price AS product_price, p.is_hidden AS product_hidden
     FROM product_variants pv JOIN products p ON p.id = pv.product_id WHERE pv.id = ?`,
    [variantId]
  );
  return rows[0] || null;
};

// Top san pham ban chay nhat (cho thong ke admin)
export const findTopSelling = async (limit = 5) => {
  const [rows] = await pool.query<TopProductRow[]>(
    `SELECT p.id, p.name, p.price, p.sold_count,
      (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_main DESC, pi.id ASC LIMIT 1) AS main_image
     FROM products p
     ORDER BY p.sold_count DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};
