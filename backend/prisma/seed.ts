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

async function main() {
  console.log('→ Xóa dữ liệu cũ (15 bảng)...')
  await prisma.$transaction([
    prisma.sepayWebhookLog.deleteMany(),
    prisma.payment.deleteMany(),
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
      { userId: customer.id, label: 'Nhà riêng', name: 'Trần Duy', phone: '0901 234 567', street: '86 Nguyễn Huệ', ward: 'Phường Bến Nghé', district: 'Quận 1', city: 'TP. Hồ Chí Minh', isDefault: true },
      { userId: customer.id, label: 'Văn phòng', name: 'Trần Duy', phone: '0938 765 432', street: 'Tầng 12, Landmark 81, 720A Điện Biên Phủ', ward: 'Phường 22', district: 'Quận Bình Thạnh', city: 'TP. Hồ Chí Minh' },
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

  console.log('→ Tạo voucher & banner...')
  await prisma.voucher.createMany({
    data: [
      { code: 'HOANGNHA15', type: 'percent', value: 15, description: 'Giảm 15% cho đơn hàng đầu tiên', minOrder: 500000, expiry: new Date('2026-12-31') },
      { code: 'FREESHIP', type: 'freeship', value: 0, description: 'Miễn phí vận chuyển toàn quốc', minOrder: 300000, expiry: new Date('2026-12-31') },
      { code: 'LUXURY100', type: 'fixed', value: 100000, description: 'Giảm 100.000đ cho đơn từ 1 triệu', minOrder: 1000000, expiry: new Date('2026-12-31') },
      { code: 'VIPGOLD20', type: 'percent', value: 20, description: 'Ưu đãi khách hàng thân thiết', minOrder: 800000, expiry: new Date('2026-12-31'), usageLimit: 1, usedCount: 1 },
    ],
  })

  await prisma.banner.createMany({
    data: [
      { eyebrow: 'Bộ sưu tập Thu — Đông 2026', title: 'Nghệ thuật của sự tối giản', subtitle: 'Những thiết kế vượt thời gian, tôn vinh vẻ đẹp trong từng đường cắt.', image: u('photo-1490481651871-ab68de25d43d', 1800), cta: 'Khám phá ngay', sortOrder: 0 },
      { eyebrow: 'New Season Essentials', title: 'Định nghĩa lại phong cách', subtitle: 'Chất liệu cao cấp gặp gỡ ngôn ngữ thiết kế đương đại.', image: u('photo-1469334031218-e382a71b716b', 1800), cta: 'Mua sắm ngay', sortOrder: 1 },
      { eyebrow: 'Hoàng Nha Atelier', title: 'Sang trọng trong im lặng', subtitle: 'Quiet luxury — khi chất lượng tự lên tiếng thay cho logo.', image: u('photo-1441986300917-64674bd600d8', 1800), cta: 'Xem bộ sưu tập', sortOrder: 2 },
    ],
  })

  console.log('→ Tạo đánh giá & đơn hàng mẫu...')
  const reviewData = [
    { rating: 5, title: 'Chất lượng vượt mong đợi', content: 'Chất vải dày dặn, đường may cực kỳ tinh tế. Mặc lên có cảm giác rất "đắt tiền".' },
    { rating: 5, title: 'Phong cách rất Zara, rất COS', content: 'Mình đã mua 3 lần và lần nào cũng hài lòng. Thiết kế tối giản nhưng khác biệt.' },
    { rating: 4, title: 'Dịch vụ tuyệt vời', content: 'Giao hàng nhanh, nhân viên tư vấn size chính xác. Blazer mặc vừa in.' },
  ]
  for (let i = 0; i < reviewData.length; i++) {
    await prisma.review.create({
      data: { ...reviewData[i], userId: customer.id, productId: i + 1, approved: true },
    })
  }

  // Đơn hàng mẫu: đang giao, đã thanh toán — vận đơn gộp thẳng trong Order
  const p1 = await prisma.product.findFirst({ where: { slug: 'san-pham-1' }, include: { images: true } })
  const p3 = await prisma.product.findFirst({ where: { slug: 'san-pham-3' }, include: { images: true } })
  if (p1 && p3) {
    const total = p1.price + p3.price * 2
    await prisma.order.create({
      data: {
        id: 'HN-24081', userId: customer.id, status: 'shipping', paymentMethod: 'qr',
        shippingFee: 0, subtotal: total, total,
        receiverName: 'Trần Duy', receiverPhone: '0901234567', receiverEmail: customer.email,
        addressText: '86 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        shipCarrier: 'GHN Express', trackingCode: 'GHN512384756', shippedAt: new Date(Date.now() - 86400000),
        items: {
          create: [
            { productId: p1.id, name: p1.name, price: p1.price, quantity: 1, color: 'Đen', size: 'M', image: p1.images[0].url },
            { productId: p3.id, name: p3.name, price: p3.price, quantity: 2, color: 'Trắng', size: 'L', image: p3.images[0].url },
          ],
        },
        payment: { create: { method: 'qr', amount: total, status: 'paid', paidAt: new Date(Date.now() - 2 * 86400000), transactionCode: 'SEPAY1720000001' } },
      },
    })
  }

  await prisma.notification.createMany({
    data: [
      { userId: customer.id, title: 'Đơn hàng đang được giao', content: 'Đơn HN-24081 dự kiến giao vào ngày mai.', type: 'order' },
      { userId: customer.id, title: 'Flash Sale cuối tuần 🔥', content: 'Giảm đến 50% cho BST Thu-Đông. Chỉ trong 48 giờ!', type: 'promo' },
    ],
  })

  console.log('✓ Seed hoàn tất (15 bảng)!')
  console.log('  Admin   : admin@hoangnha.vn / admin1234')
  console.log('  Customer: duytran.220218@gmail.com / 12345678')
  console.log(`  Đã tạo: ${NAMES.length} sản phẩm, ${CATEGORIES.length} danh mục, 4 voucher, 3 banner, 1 đơn mẫu. Admin id=${admin.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
