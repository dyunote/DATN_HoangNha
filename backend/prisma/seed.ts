import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const u = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

const CATEGORIES = [
  { name: 'Áo khoác', slug: 'ao-khoac', image: u('photo-1539533018447-63fcce2678e3') },
  { name: 'Đầm & Váy', slug: 'dam-vay', image: u('photo-1595777457583-95e059d581b8') },
  { name: 'Sơ mi', slug: 'so-mi', image: u('photo-1596755094514-f87e34085b2c') },
  { name: 'Quần', slug: 'quan', image: u('photo-1541099649105-f69ad21f3246') },
  { name: 'Áo thun', slug: 'ao-thun', image: u('photo-1521572163474-6864f9cf17ab') },
  { name: 'Phụ kiện', slug: 'phu-kien', image: u('photo-1492707892479-7bc8d5a4ee93') },
]

const IMGS = [
  'photo-1515886657613-9f3515b0c78f', 'photo-1529139574466-a303027c1d8b', 'photo-1487222477894-8943e31ef7b2',
  'photo-1539109136881-3be0616acf4b', 'photo-1524504388940-b1c1722653e1', 'photo-1496747611176-843222e1e57c',
  'photo-1509631179647-0177331693ae', 'photo-1485968579580-b6d095142e6e', 'photo-1479064555552-3ef4979f8908',
  'photo-1519085360753-af0119f7cbe7', 'photo-1507003211169-0a1dd7228f2d', 'photo-1551028719-00167b16eac5',
  'photo-1542272604-787c3835535d', 'photo-1560243563-062bfc001d68', 'photo-1591047139829-d91aecb6caea',
  'photo-1594633312681-425c7b97ccd1', 'photo-1618354691373-d851c5c3a990', 'photo-1617137968427-85924c800a22',
  'photo-1488161628813-04466f872be2', 'photo-1434389677669-e08b4cac3105', 'photo-1445205170230-053b83016050',
  'photo-1483985988355-763728e1935b', 'photo-1490481651871-ab68de25d43d', 'photo-1469334031218-e382a71b716b',
]

const NAMES: [string, string, number][] = [
  ['Áo khoác dạ Oversized Wool', 'ao-khoac', 720], ['Đầm lụa Midi Thanh Lịch', 'dam-vay', 890],
  ['Sơ mi Linen Premium Trắng', 'so-mi', 450], ['Blazer Cấu Trúc Hiện Đại', 'ao-khoac', 1150],
  ['Quần Âu Ống Suông Wide-leg', 'quan', 520], ['Áo thun Cotton Supima Basic', 'ao-thun', 220],
  ['Đầm Slip Satin Đêm Tiệc', 'dam-vay', 780], ['Cardigan Cashmere Mềm Mại', 'ao-khoac', 960],
  ['Chân váy Midi Xếp Ly', 'dam-vay', 430], ['Trench Coat Cổ Điển Beige', 'ao-khoac', 1350],
  ['Sơ mi Oxford Regular Fit', 'so-mi', 380], ['Quần Jeans Straight Vintage', 'quan', 490],
  ['Áo len Merino Cổ Lọ', 'ao-thun', 540], ['Đầm Wrap Hoa Nhí Mùa Hè', 'dam-vay', 610],
  ['Túi Tote Da Minimal', 'phu-kien', 850], ['Khăn lụa Twill Họa Tiết', 'phu-kien', 320],
  ['Áo Polo Piqué Luxury', 'ao-thun', 340], ['Quần Short Linen Nghỉ Dưỡng', 'quan', 290],
  ['Vest Không Tay Smart Casual', 'ao-khoac', 680], ['Sơ mi Lụa Tay Bồng', 'so-mi', 560],
  ['Đầm Maxi Cổ Yếm Sang Trọng', 'dam-vay', 920], ['Quần Culottes Thanh Lịch', 'quan', 470],
  ['Áo Hoodie Cotton Nặng Premium', 'ao-thun', 420], ['Belt Da Ý Khóa Kim Loại', 'phu-kien', 380],
]

const COLOR_SETS = [
  [{ name: 'Đen', hex: '#111111' }, { name: 'Kem', hex: '#EDE6D6' }, { name: 'Be', hex: '#D6B98C' }],
  [{ name: 'Trắng', hex: '#FFFFFF' }, { name: 'Xám', hex: '#94A3B8' }, { name: 'Navy', hex: '#1E293B' }],
  [{ name: 'Nâu', hex: '#8B6F47' }, { name: 'Đen', hex: '#111111' }, { name: 'Olive', hex: '#6B7250' }],
]

// Phụ thu theo kích cỡ: size càng lớn càng tốn vải
const SIZE_SURCHARGE: Record<string, number> = { XS: 0, S: 0, M: 0, L: 20000, XL: 50000, XXL: 80000 }

const MATERIALS = ['Cotton hữu cơ', 'Lụa tơ tằm', 'Linen Pháp', 'Wool Ý', 'Cashmere', 'Denim Nhật']
const BRANDS = ['Hoàng Nha', 'HN Studio', 'Atelier HN', 'HN Essentials']
const DESCRIPTION =
  'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.'

// ============================================================
// 50 SẢN PHẨM MỚI (id 25-74) — bổ sung sau 24 SP gốc.
// Ảnh Unsplash đã CHỌN ĐÚNG theo từng danh mục (kiểm tra bằng mắt),
// không dùng chung pool ngẫu nhiên để tránh ảnh sai loại.
// ============================================================
const IMG_BY_CAT: Record<string, string[]> = {
  'ao-khoac': ['1539533018447-63fcce2678e3', '1487222477894-8943e31ef7b2', '1539109136881-3be0616acf4b', '1519085360753-af0119f7cbe7', '1551028719-00167b16eac5', '1591047139829-d91aecb6caea', '1617137968427-85924c800a22'],
  'dam-vay': ['1595777457583-95e059d581b8', '1496747611176-843222e1e57c', '1572804013309-59a88b7e92f1', '1566174053879-31528523f8ae', '1515372039744-b8f02a3ae446', '1585487000160-6ebcfceb0d03', '1596783074918-c84cb06531ca', '1591369822096-ffd140ec948f'],
  'so-mi': ['1596755094514-f87e34085b2c', '1602810318383-e386cc2a3ccf', '1603252109303-2751441dd157', '1598033129183-c4f50c736f10', '1620012253295-c15cc3e65df4', '1607345366928-199ea26cfe3e', '1621072156002-e2fccdc0b176', '1485968579580-b6d095142e6e'],
  'quan': ['1541099649105-f69ad21f3246', '1515886657613-9f3515b0c78f', '1509631179647-0177331693ae', '1542272604-787c3835535d', '1560243563-062bfc001d68', '1594633312681-425c7b97ccd1'],
  'ao-thun': ['1521572163474-6864f9cf17ab', '1529139574466-a303027c1d8b', '1507003211169-0a1dd7228f2d', '1618354691373-d851c5c3a990', '1434389677669-e08b4cac3105', '1469334031218-e382a71b716b'],
  'phu-kien': ['1492707892479-7bc8d5a4ee93', '1479064555552-3ef4979f8908', '1584917865442-de89df76afd3', '1553062407-98eeb64c6a62'],
}
const ACC_BAG = '1584917865442-de89df76afd3'   // túi xách da
const ACC_BACK = '1553062407-98eeb64c6a62'     // balo
const ACC_FLAT = '1492707892479-7bc8d5a4ee93'  // flatlay phụ kiện
const ACC_BOOT = '1479064555552-3ef4979f8908'  // flatlay giày + phụ kiện
const NEW_MATERIALS = ['Cotton hữu cơ', 'Lụa tơ tằm', 'Linen Pháp', 'Wool Ý', 'Cashmere', 'Denim Nhật', 'Nỉ bông', 'Da thật']

// 4 ảnh cho phụ kiện — ảnh đầu khớp đúng món đồ theo tên
function phuKienImgs(name: string): string[] {
  const n = name.toLowerCase()
  const lead =
    n.includes('túi xách') || n.includes('ví') || n.includes('tote') ? ACC_BAG : n.includes('balo') ? ACC_BACK : ACC_FLAT
  return [lead, ...[ACC_BAG, ACC_BACK, ACC_FLAT, ACC_BOOT].filter((x) => x !== lead)]
}
// 4 ảnh đúng danh mục cho 1 sản phẩm (xoay vòng để đỡ trùng)
function imgsForCat(slug: string, idx: number, name: string): string[] {
  if (slug === 'phu-kien') return phuKienImgs(name)
  const pool = IMG_BY_CAT[slug]
  const start = idx % pool.length
  return [0, 1, 2, 3].map((k) => pool[(start + k) % pool.length])
}

// [tên, slug danh mục, giá (nghìn đồng)]
const NEW_PRODUCTS: [string, string, number][] = [
  ['Áo khoác Bomber Chần Bông', 'ao-khoac', 650],
  ['Áo khoác Denim Rách Bụi', 'ao-khoac', 480],
  ['Áo Blazer Kẻ Sọc Herringbone', 'ao-khoac', 1180],
  ['Áo khoác Puffer Lông Vũ', 'ao-khoac', 990],
  ['Áo khoác Da Lộn Suede Cao Cấp', 'ao-khoac', 1450],
  ['Cardigan Len Dệt Kim Cổ V', 'ao-khoac', 560],
  ['Áo khoác Măng Tô Dáng Dài', 'ao-khoac', 1590],
  ['Áo Blazer Nhung Tuyết Sang Trọng', 'ao-khoac', 1290],
  ['Áo khoác Gió Chống Nước', 'ao-khoac', 520],
  ['Đầm Sơ Mi Dáng Suông', 'dam-vay', 590],
  ['Đầm Xòe Cổ Vuông Tiểu Thư', 'dam-vay', 720],
  ['Đầm Body Dệt Kim Ôm Dáng', 'dam-vay', 480],
  ['Chân váy Bút Chì Công Sở', 'dam-vay', 390],
  ['Đầm Voan Hoa Nhí Xếp Tầng', 'dam-vay', 650],
  ['Chân váy Chữ A Vải Tweed', 'dam-vay', 450],
  ['Đầm Dạ Hội Lụa Ánh Kim', 'dam-vay', 1250],
  ['Đầm Babydoll Tay Phồng', 'dam-vay', 540],
  ['Chân váy Denim Cạp Cao', 'dam-vay', 420],
  ['Sơ mi Bò Denim Wash Nhẹ', 'so-mi', 460],
  ['Sơ mi Kẻ Caro Flannel', 'so-mi', 420],
  ['Sơ mi Lụa Satin Cổ Đức', 'so-mi', 590],
  ['Sơ mi Trắng Công Sở Slim', 'so-mi', 400],
  ['Sơ mi Oversize Tay Dài Unisex', 'so-mi', 440],
  ['Sơ mi Kẻ Sọc Thanh Mảnh', 'so-mi', 430],
  ['Sơ mi Cổ Tàu Vintage', 'so-mi', 470],
  ['Áo Kiểu Sơ Mi Tay Bồng Nữ', 'so-mi', 510],
  ['Quần Jeans Skinny Co Giãn', 'quan', 490],
  ['Quần Tây Âu Xếp Ly', 'quan', 550],
  ['Quần Jogger Nỉ Bo Gấu', 'quan', 350],
  ['Quần Baggy Ống Rộng Vintage', 'quan', 470],
  ['Quần Short Kaki Nam', 'quan', 320],
  ['Quần Culottes Vải Đũi', 'quan', 460],
  ['Quần Jeans Boyfriend Rách Gối', 'quan', 520],
  ['Quần Legging Nâng Mông Thể Thao', 'quan', 290],
  ['Áo thun Oversize In Họa Tiết', 'ao-thun', 260],
  ['Áo Polo Cotton Cá Sấu', 'ao-thun', 350],
  ['Áo thun Croptop Nữ Basic', 'ao-thun', 220],
  ['Áo len Tăm Cổ Tròn', 'ao-thun', 480],
  ['Áo Hoodie Nỉ Bông Unisex', 'ao-thun', 450],
  ['Áo thun Tanktop Ba Lỗ', 'ao-thun', 190],
  ['Áo len Cardigan Mỏng Nữ', 'ao-thun', 520],
  ['Áo Sweater Cổ Lọ Dệt Kim', 'ao-thun', 540],
  ['Túi Xách Đeo Chéo Da Bò', 'phu-kien', 780],
  ['Balo Laptop Chống Sốc', 'phu-kien', 650],
  ['Túi Tote Vải Canvas In', 'phu-kien', 290],
  ['Thắt Lưng Da Khóa Tự Động', 'phu-kien', 350],
  ['Khăn Choàng Cổ Len Cashmere', 'phu-kien', 320],
  ['Mũ Nồi Beret Nữ', 'phu-kien', 210],
  ['Kính Râm Gọng Kim Loại', 'phu-kien', 420],
  ['Ví Da Cầm Tay Nữ', 'phu-kien', 480],
]

async function main() {
  console.log('→ Xóa dữ liệu cũ (13 bảng)...')
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.review.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.variant.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.address.deleteMany(),
    prisma.voucher.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.user.deleteMany(),
  ])

  console.log('→ Tạo người dùng...')
  const [admin, customer] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Quản trị viên', email: 'admin@hoangnha.vn',
        passwordHash: await bcrypt.hash('admin1234', 10),
        role: 'ADMIN', avatar: 'https://i.pravatar.cc/160?img=13',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Trần Duy', email: 'duytran.220218@gmail.com',
        passwordHash: await bcrypt.hash('12345678', 10),
        phone: '0901234567', gender: 'Nam', birthday: '2002-02-18',
        avatar: 'https://i.pravatar.cc/160?img=13',
      },
    }),
  ])

  await prisma.address.createMany({
    data: [
      { userId: customer.id, label: 'Nhà riêng', name: 'Trần Duy', phone: '0901 234 567', street: '86 Nguyễn Huệ', ward: 'Phường Bến Nghé', city: 'TP. Hồ Chí Minh', isDefault: true },
      { userId: customer.id, label: 'Văn phòng', name: 'Trần Duy', phone: '0938 765 432', street: 'Tầng 12, Landmark 81, 720A Điện Biên Phủ', ward: 'Phường 22', city: 'TP. Hồ Chí Minh' },
    ],
  })

  console.log('→ Tạo danh mục & sản phẩm...')
  const catMap = new Map<string, number>()
  for (const c of CATEGORIES) {
    const created = await prisma.category.create({ data: c })
    catMap.set(c.slug, created.id)
  }

  for (let i = 0; i < NAMES.length; i++) {
    const [name, catSlug, priceK] = NAMES[i]
    const onSale = i % 3 === 0
    const price = priceK * 1000
    const colors = COLOR_SETS[i % COLOR_SETS.length]
    const sizes = catSlug === 'phu-kien' ? ['One Size'] : ['XS', 'S', 'M', 'L', 'XL']
    await prisma.product.create({
      data: {
        // Gán id CỐ ĐỊNH: AUTO_INCREMENT không reset khi xóa, seed lần 2 sẽ ra
        // id 25+ trong khi frontend/localStorage dùng id 1-24 → lỗi "SP không tồn tại".
        id: i + 1,
        name,
        slug: `san-pham-${i + 1}`,
        categoryId: catMap.get(catSlug)!,
        description: DESCRIPTION,
        price: onSale ? Math.round(price * 0.75) : price,
        oldPrice: onSale ? price : null,
        brand: BRANDS[i % BRANDS.length],
        material: MATERIALS[i % MATERIALS.length],
        rating: 4 + ((i * 7) % 10) / 10,
        reviewCount: 12 + ((i * 37) % 220),
        sold: 40 + ((i * 53) % 900),
        isNew: i < 8,
        isBestSeller: i % 4 === 1,
        isTrending: i % 3 === 2,
        flashSale: onSale && i < 15,
        images: {
          create: [IMGS[i], IMGS[(i + 5) % IMGS.length], IMGS[(i + 11) % IMGS.length], IMGS[(i + 17) % IMGS.length]]
            .map((img, idx) => ({ url: u(img), sortOrder: idx })),
        },
        variants: {
          create: colors.flatMap((c, ci) =>
            sizes.map((s) => ({
              color: c.name,
              colorHex: c.hex,
              size: s,
              stock: 3 + ((i * 13 + s.length) % 20),
              // Giá riêng theo biến thể — chỉ đặt cho vài sản phẩm để minh họa
              // (size lớn tốn vải hơn, màu đầu là màu limited có phụ thu).
              ...(i % 4 === 0
                ? {
                    price:
                      (onSale ? Math.round(price * 0.75) : price) +
                      (SIZE_SURCHARGE[s] ?? 0) +
                      (ci === 0 ? 30000 : 0),
                    oldPrice: onSale ? price + (SIZE_SURCHARGE[s] ?? 0) : null,
                  }
                : {}),
            })),
          ),
        },
      },
    })
  }

  console.log('→ Tạo 50 sản phẩm mới (id 25-74)...')
  for (let i = 0; i < NEW_PRODUCTS.length; i++) {
    const [name, catSlug, priceK] = NEW_PRODUCTS[i]
    const pid = 25 + i
    const onSale = i % 3 === 0
    const base = priceK * 1000
    const price = onSale ? Math.round(base * 0.75) : base
    const material = NEW_MATERIALS[i % NEW_MATERIALS.length]
    const colors = COLOR_SETS[i % COLOR_SETS.length]
    const sizes = catSlug === 'phu-kien' ? ['One Size'] : ['XS', 'S', 'M', 'L', 'XL']
    const perVariantPrice = i % 4 === 0 && catSlug !== 'phu-kien'
    await prisma.product.create({
      data: {
        id: pid,
        name,
        slug: `san-pham-${pid}`,
        categoryId: catMap.get(catSlug)!,
        description: `${name} — thiết kế ${material.toLowerCase()} cao cấp theo phong cách tối giản, phom dáng tôn dáng và dễ phối đồ. Đường may tinh xảo, chất liệu bền đẹp, phù hợp cả đi làm lẫn dạo phố. Sản phẩm thuộc bộ sưu tập mới của Hoàng Nha Fashion.`,
        price,
        oldPrice: onSale ? base : null,
        brand: BRANDS[i % BRANDS.length],
        material,
        rating: Math.round((4 + ((i * 7) % 10) / 10) * 10) / 10,
        reviewCount: 8 + ((i * 29) % 210),
        sold: 20 + ((i * 47) % 880),
        isNew: i < 14,
        isBestSeller: i % 4 === 2,
        isTrending: i % 3 === 1,
        flashSale: onSale && i % 2 === 0,
        images: {
          create: imgsForCat(catSlug, i, name).map((img, idx) => ({ url: u(img), sortOrder: idx })),
        },
        variants: {
          create: colors.flatMap((c, ci) =>
            sizes.map((s) => ({
              color: c.name,
              colorHex: c.hex,
              size: s,
              stock: 3 + ((i * 13 + s.length) % 20),
              ...(perVariantPrice
                ? {
                    price: price + (SIZE_SURCHARGE[s] ?? 0) + (ci === 0 ? 30000 : 0),
                    oldPrice: onSale ? base + (SIZE_SURCHARGE[s] ?? 0) : null,
                  }
                : {}),
            })),
          ),
        },
      },
    })
  }

  console.log('→ Tạo voucher & banner...')
  await prisma.voucher.createMany({
    data: [
      { code: 'HOANGNHA15', type: 'percent', value: 15, description: 'Giảm 15% cho đơn hàng đầu tiên', minOrder: 500000, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') },
      { code: 'FREESHIP', type: 'freeship', value: 0, description: 'Miễn phí vận chuyển toàn quốc', minOrder: 300000, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') },
      { code: 'LUXURY100', type: 'fixed', value: 100000, description: 'Giảm 100.000đ cho đơn từ 1 triệu', minOrder: 1000000, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') },
      { code: 'VIPGOLD20', type: 'percent', value: 20, description: 'Ưu đãi khách hàng thân thiết', minOrder: 800000, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), usageLimit: 1, usedCount: 1 },
    ],
  })

  await prisma.banner.createMany({
    data: [
      { eyebrow: 'Bộ sưu tập Thu — Đông 2026', title: 'Nghệ thuật của sự tối giản', subtitle: 'Những thiết kế vượt thời gian, tôn vinh vẻ đẹp trong từng đường cắt.', image: u('photo-1490481651871-ab68de25d43d', 1800), cta: 'Khám phá ngay', sortOrder: 0 },
      { eyebrow: 'New Season Essentials', title: 'Định nghĩa lại phong cách', subtitle: 'Chất liệu cao cấp gặp gỡ ngôn ngữ thiết kế đương đại.', image: u('photo-1469334031218-e382a71b716b', 1800), cta: 'Mua sắm ngay', sortOrder: 1 },
      { eyebrow: 'Hoàng Nha Atelier', title: 'Sang trọng trong im lặng', subtitle: 'Quiet luxury — khi chất lượng tự lên tiếng thay cho logo.', image: u('photo-1441986300917-64674bd600d8', 1800), cta: 'Xem bộ sưu tập', sortOrder: 2 },
    ],
  })

  console.log('→ Tạo đơn hàng mẫu...')

  // Đơn hàng mẫu: đang giao, đã thanh toán — vận đơn gộp thẳng trong Order.
  // Lấy kèm variants vì OrderItem giờ BẮT BUỘC có variantId (nối thẳng biến thể).
  const p1 = await prisma.product.findFirst({ where: { slug: 'san-pham-1' }, include: { images: true, variants: true } })
  const p3 = await prisma.product.findFirst({ where: { slug: 'san-pham-3' }, include: { images: true, variants: true } })
  const v1 = p1?.variants[0]
  const v3 = p3?.variants[1] ?? p3?.variants[0]

  // Thanh toán GỘP trong orders (không còn bảng payments / sepay_webhook_logs)
  const PAY_CODE = 'HN24081AB7X'

  if (p1 && p3 && v1 && v3) {
    const total = p1.price + p3.price * 2
    await prisma.order.create({
      data: {
        id: 'HN-24081', userId: customer.id, status: 'shipping', paymentMethod: 'qr',
        shippingFee: 0, subtotal: total, total,
        receiverName: 'Trần Duy', receiverPhone: '0901234567', receiverEmail: customer.email,
        addressText: '86 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh',
        shipCarrier: 'GHN Express', trackingCode: 'GHN512384756', shippedAt: new Date(Date.now() - 86400000),
        paymentStatus: 'paid', payCode: PAY_CODE,
        paidAt: new Date(Date.now() - 2 * 86400000), transactionCode: 'SEPAY1720000001',
        // order_items chỉ nối vào variants — product suy ra qua variant
        items: {
          create: [
            { variantId: v1.id, name: p1.name, price: p1.price, quantity: 1, color: v1.color, size: v1.size, image: p1.images[0].url },
            { variantId: v3.id, name: p3.name, price: p3.price, quantity: 2, color: v3.color, size: v3.size, image: p3.images[0].url },
          ],
        },
      },
    })
  }

  console.log('→ Tạo đánh giá...')
  // reviews giờ BẮT BUỘC nối vào variants (ERD mới) — sản phẩm suy ra qua
  // variants.product_id, nên đánh giá "chung" cũng gắn vào 1 biến thể cụ thể.
  const v2 = await prisma.variant.findFirst({ where: { productId: 2 }, orderBy: { id: 'asc' } })
  const reviewData = [
    { rating: 5, variantId: v1?.id, title: 'Chất lượng vượt mong đợi', content: 'Chất vải dày dặn, đường may cực kỳ tinh tế. Mặc lên có cảm giác rất "đắt tiền".', adminReply: null },
    { rating: 5, variantId: v2?.id, title: 'Phong cách rất Zara, rất COS', content: 'Mình đã mua 3 lần và lần nào cũng hài lòng. Thiết kế tối giản nhưng khác biệt.', adminReply: null },
    { rating: 4, variantId: v3?.id, title: 'Dịch vụ tuyệt vời', content: 'Giao hàng nhanh, nhân viên tư vấn size chính xác. Blazer mặc vừa in.', adminReply: 'Cảm ơn bạn đã tin tưởng Hoàng Nha!' },
  ]
  for (const r of reviewData) {
    if (!r.variantId) continue
    await prisma.review.create({ data: { ...r, variantId: r.variantId, userId: customer.id, approved: true } })
  }

  console.log('→ Tạo giỏ hàng mẫu...')
  // Giỏ trỏ thẳng vào variantId (không còn color/size dạng chuỗi).
  // Lấy variant có sẵn trong DB thay vì hardcode id: id biến thể phụ thuộc thứ tự
  // tạo ở trên, hardcode là hỏng ngay khi đổi COLOR_SETS hoặc danh sách size.
  const cartVariants = await prisma.variant.findMany({
    where: { productId: { in: [5, 8] }, size: { in: ['M', 'L'] } },
    orderBy: { id: 'asc' },
    distinct: ['productId'],
  })
  if (cartVariants.length) {
    await prisma.cartItem.createMany({
      data: cartVariants.map((v, i) => ({
        userId: customer.id, variantId: v.id, quantity: i + 1,
      })),
    })
  }

  // Thông báo giờ trỏ được về nguồn: đơn hàng (orderId) hoặc voucher (voucherId)
  const promoVoucher = await prisma.voucher.findFirst({ orderBy: { id: 'asc' } })
  const sampleOrder = await prisma.order.findUnique({ where: { id: 'HN-24081' }, select: { id: true } })
  await prisma.notification.createMany({
    data: [
      { userId: customer.id, orderId: sampleOrder?.id ?? null, title: 'Đơn hàng đang được giao', content: 'Đơn HN-24081 dự kiến giao vào ngày mai.', type: 'order' },
      { userId: customer.id, voucherId: promoVoucher?.id ?? null, title: 'Flash Sale cuối tuần 🔥', content: 'Giảm đến 50% cho BST Thu-Đông. Chỉ trong 48 giờ!', type: 'promo' },
    ],
  })

  console.log('✓ Seed hoàn tất (13 bảng)!')
  console.log('  Admin   : admin@hoangnha.vn / admin1234')
  console.log('  Customer: duytran.220218@gmail.com / 12345678')
  console.log(`  Đã tạo: ${NAMES.length + NEW_PRODUCTS.length} sản phẩm, ${CATEGORIES.length} danh mục, 4 voucher, 3 banner, 1 đơn mẫu. Admin id=${admin.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
