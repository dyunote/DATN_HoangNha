import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

const router = Router()

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: true,
} satisfies Prisma.ProductInclude

// Chuyển đổi về shape mà frontend đang dùng
export function toDto(p: Prisma.ProductGetPayload<{ include: typeof productInclude }>) {
  const colorMap = new Map<string, string>()
  const sizeSet = new Set<string>()
  let stock = 0
  for (const v of p.variants) {
    colorMap.set(v.color, v.colorHex)
    sizeSet.add(v.size)
    stock += v.stock
  }

  // Giá thực tế của từng biến thể: có giá riêng thì dùng, không thì lấy giá sản phẩm
  const variants = p.variants.map((v) => ({
    id: v.id,
    color: v.color,
    colorHex: v.colorHex,
    size: v.size,
    stock: v.stock,
    price: v.price ?? p.price,
    oldPrice: v.oldPrice ?? p.oldPrice ?? undefined,
  }))

  // Khoảng giá để ProductCard hiện "từ 220.000đ" khi các biến thể khác giá nhau.
  // Tính từ variants thay vì p.price vì giá hiển thị phải là giá khách thật sự trả.
  const prices = variants.map((v) => v.price)
  const minPrice = prices.length ? Math.min(...prices) : p.price
  const maxPrice = prices.length ? Math.max(...prices) : p.price

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category.name,
    categorySlug: p.category.slug,
    brand: p.brand,
    // price = giá thấp nhất trong các biến thể (giá "từ" hiển thị ngoài danh sách)
    price: minPrice,
    minPrice,
    maxPrice,
    /** true = các biến thể có giá khác nhau → UI hiện "từ ...đ" */
    hasPriceRange: minPrice !== maxPrice,
    oldPrice: p.oldPrice ?? undefined,
    images: p.images.map((i) => i.url),
    colors: [...colorMap].map(([name, hex]) => ({ name, hex })),
    sizes: [...sizeSet],
    variants,
    material: p.material,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stock,
    sold: p.sold,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    isTrending: p.isTrending,
    flashSale: p.flashSale,
    description: p.description,
    tags: ['minimal', 'luxury', 'premium'],
  }
}

// UC-06/07: Danh sách sản phẩm + lọc + sắp xếp + phân trang
router.get('/', async (req, res) => {
  const { category, q, sale, sort, page = '1', limit = '12', maxPrice, minRating, brand } = req.query as Record<string, string>

  const where: Prisma.ProductWhereInput = {}
  if (category) where.category = { slug: category }
  if (q) where.name = { contains: q }
  if (sale === '1') where.oldPrice = { not: null }
  if (maxPrice) where.price = { lte: Number(maxPrice) }
  if (minRating) where.rating = { gte: Number(minRating) }
  if (brand) where.brand = { in: brand.split(',') }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price-asc' ? { price: 'asc' }
    : sort === 'price-desc' ? { price: 'desc' }
    : sort === 'rating' ? { rating: 'desc' }
    : sort === 'bestseller' ? { sold: 'desc' }
    : sort === 'newest' ? { createdAt: 'desc' }
    : { id: 'asc' }

  const take = Math.min(48, Number(limit))
  const skip = (Math.max(1, Number(page)) - 1) * take

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take, include: productInclude }),
    prisma.product.count({ where }),
  ])

  res.json({ items: items.map(toDto), total, page: Number(page), totalPages: Math.ceil(total / take) })
})

// UC-08: Chi tiết sản phẩm
router.get('/:id', async (req, res) => {
  const p = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: productInclude,
  })
  if (!p) {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm' })
    return
  }
  res.json(toDto(p))
})

// Đánh giá của sản phẩm (đã duyệt)
router.get('/:id/reviews', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: Number(req.params.id), approved: true },
    include: { user: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(reviews.map((r) => ({
    id: r.id, rating: r.rating, title: r.title, content: r.content,
    author: r.user.name, avatar: r.user.avatar,
    date: r.createdAt.toLocaleDateString('vi-VN'),
  })))
})

export default router
