import type { Product, Category, Review, Address, Order, Voucher, Notification } from '@/types'

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const HERO_SLIDES = [
  {
    id: 1,
    image: u('photo-1490481651871-ab68de25d43d', 1800),
    eyebrow: 'Bộ sưu tập Thu — Đông 2026',
    title: 'Nghệ thuật của sự tối giản',
    subtitle: 'Những thiết kế vượt thời gian, tôn vinh vẻ đẹp trong từng đường cắt.',
    cta: 'Khám phá ngay',
  },
  {
    id: 2,
    image: u('photo-1469334031218-e382a71b716b', 1800),
    eyebrow: 'New Season Essentials',
    title: 'Định nghĩa lại phong cách',
    subtitle: 'Chất liệu cao cấp gặp gỡ ngôn ngữ thiết kế đương đại.',
    cta: 'Mua sắm ngay',
  },
  {
    id: 3,
    image: u('photo-1441986300917-64674bd600d8', 1800),
    eyebrow: 'Hoàng Nha Atelier',
    title: 'Sang trọng trong im lặng',
    subtitle: 'Quiet luxury — khi chất lượng tự lên tiếng thay cho logo.',
    cta: 'Xem bộ sưu tập',
  },
]

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Áo khoác', slug: 'ao-khoac', image: u('photo-1539533018447-63fcce2678e3'), count: 48 },
  { id: 2, name: 'Đầm & Váy', slug: 'dam-vay', image: u('photo-1595777457583-95e059d581b8'), count: 76 },
  { id: 3, name: 'Sơ mi', slug: 'so-mi', image: u('photo-1596755094514-f87e34085b2c'), count: 54 },
  { id: 4, name: 'Quần', slug: 'quan', image: u('photo-1541099649105-f69ad21f3246'), count: 62 },
  { id: 5, name: 'Áo thun', slug: 'ao-thun', image: u('photo-1521572163474-6864f9cf17ab'), count: 89 },
  { id: 6, name: 'Phụ kiện', slug: 'phu-kien', image: u('photo-1492707892479-7bc8d5a4ee93'), count: 35 },
]

const IMGS = [
  'photo-1515886657613-9f3515b0c78f',
  'photo-1529139574466-a303027c1d8b',
  'photo-1487222477894-8943e31ef7b2',
  'photo-1539109136881-3be0616acf4b',
  'photo-1524504388940-b1c1722653e1',
  'photo-1496747611176-843222e1e57c',
  'photo-1509631179647-0177331693ae',
  'photo-1485968579580-b6d095142e6e',
  'photo-1479064555552-3ef4979f8908',
  'photo-1519085360753-af0119f7cbe7',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1551028719-00167b16eac5',
  'photo-1542272604-787c3835535d',
  'photo-1560243563-062bfc001d68',
  'photo-1591047139829-d91aecb6caea',
  'photo-1594633312681-425c7b97ccd1',
  'photo-1618354691373-d851c5c3a990',
  'photo-1617137968427-85924c800a22',
  'photo-1488161628813-04466f872be2',
  'photo-1434389677669-e08b4cac3105',
  'photo-1445205170230-053b83016050',
  'photo-1483985988355-763728e1935b',
  'photo-1490481651871-ab68de25d43d',
  'photo-1469334031218-e382a71b716b',
]

const NAMES = [
  ['Áo khoác dạ Oversized Wool', 'Áo khoác', 720],
  ['Đầm lụa Midi Thanh Lịch', 'Đầm & Váy', 890],
  ['Sơ mi Linen Premium Trắng', 'Sơ mi', 450],
  ['Blazer Cấu Trúc Hiện Đại', 'Áo khoác', 1150],
  ['Quần Âu Ống Suông Wide-leg', 'Quần', 520],
  ['Áo thun Cotton Supima Basic', 'Áo thun', 220],
  ['Đầm Slip Satin Đêm Tiệc', 'Đầm & Váy', 780],
  ['Cardigan Cashmere Mềm Mại', 'Áo khoác', 960],
  ['Chân váy Midi Xếp Ly', 'Đầm & Váy', 430],
  ['Trench Coat Cổ Điển Beige', 'Áo khoác', 1350],
  ['Sơ mi Oxford Regular Fit', 'Sơ mi', 380],
  ['Quần Jeans Straight Vintage', 'Quần', 490],
  ['Áo len Merino Cổ Lọ', 'Áo thun', 540],
  ['Đầm Wrap Hoa Nhí Mùa Hè', 'Đầm & Váy', 610],
  ['Túi Tote Da Minimal', 'Phụ kiện', 850],
  ['Khăn lụa Twill Họa Tiết', 'Phụ kiện', 320],
  ['Áo Polo Piqué Luxury', 'Áo thun', 340],
  ['Quần Short Linen Nghỉ Dưỡng', 'Quần', 290],
  ['Vest Không Tay Smart Casual', 'Áo khoác', 680],
  ['Sơ mi Lụa Tay Bồng', 'Sơ mi', 560],
  ['Đầm Maxi Cổ Yếm Sang Trọng', 'Đầm & Váy', 920],
  ['Quần Culottes Thanh Lịch', 'Quần', 470],
  ['Áo Hoodie Cotton Nặng Premium', 'Áo thun', 420],
  ['Belt Da Ý Khóa Kim Loại', 'Phụ kiện', 380],
] as const

const COLOR_SETS = [
  [
    { name: 'Đen', hex: '#111111' },
    { name: 'Kem', hex: '#EDE6D6' },
    { name: 'Be', hex: '#D6B98C' },
  ],
  [
    { name: 'Trắng', hex: '#FFFFFF' },
    { name: 'Xám', hex: '#94A3B8' },
    { name: 'Navy', hex: '#1E293B' },
  ],
  [
    { name: 'Nâu', hex: '#8B6F47' },
    { name: 'Đen', hex: '#111111' },
    { name: 'Olive', hex: '#6B7250' },
  ],
]

const MATERIALS = ['Cotton hữu cơ', 'Lụa tơ tằm', 'Linen Pháp', 'Wool Ý', 'Cashmere', 'Denim Nhật']
const BRANDS = ['Hoàng Nha', 'HN Studio', 'Atelier HN', 'HN Essentials']

export const PRODUCTS: Product[] = NAMES.map(([name, category, priceK], i) => {
  const onSale = i % 3 === 0
  const price = priceK * 1000
  return {
    id: i + 1,
    name,
    slug: `san-pham-${i + 1}`,
    category,
    brand: BRANDS[i % BRANDS.length],
    price: onSale ? Math.round(price * 0.75) : price,
    oldPrice: onSale ? price : undefined,
    images: [u(IMGS[i]), u(IMGS[(i + 5) % IMGS.length]), u(IMGS[(i + 11) % IMGS.length]), u(IMGS[(i + 17) % IMGS.length])],
    colors: COLOR_SETS[i % COLOR_SETS.length],
    sizes: category === 'Phụ kiện' ? ['One Size'] : ['XS', 'S', 'M', 'L', 'XL'],
    material: MATERIALS[i % MATERIALS.length],
    rating: 4 + ((i * 7) % 10) / 10,
    reviewCount: 12 + ((i * 37) % 220),
    stock: i % 7 === 6 ? 3 : 24 + ((i * 13) % 80),
    sold: 40 + ((i * 53) % 900),
    isNew: i < 8,
    isBestSeller: i % 4 === 1,
    isTrending: i % 3 === 2,
    flashSale: onSale && i < 15,
    description:
      'Thiết kế tối giản với phom dáng hiện đại, được chế tác từ chất liệu cao cấp nhập khẩu. Từng đường may được hoàn thiện tỉ mỉ bởi nghệ nhân với hơn 15 năm kinh nghiệm, mang lại cảm giác thoải mái tuyệt đối và vẻ ngoài thanh lịch vượt thời gian.',
    tags: ['minimal', 'luxury', 'premium'],
  }
})

export const REVIEWS: Review[] = [
  {
    id: 1,
    author: 'Minh Anh',
    avatar: 'https://i.pravatar.cc/100?img=47',
    rating: 5,
    date: '02/07/2026',
    title: 'Chất lượng vượt mong đợi',
    content: 'Chất vải dày dặn, đường may cực kỳ tinh tế. Mặc lên có cảm giác rất "đắt tiền". Đóng gói sang trọng như một món quà.',
  },
  {
    id: 2,
    author: 'Thảo Nguyên',
    avatar: 'https://i.pravatar.cc/100?img=32',
    rating: 5,
    date: '28/06/2026',
    title: 'Phong cách rất Zara, rất COS',
    content: 'Mình đã mua 3 lần và lần nào cũng hài lòng. Thiết kế tối giản nhưng khác biệt, form chuẩn dáng người Việt.',
  },
  {
    id: 3,
    author: 'Quốc Bảo',
    avatar: 'https://i.pravatar.cc/100?img=12',
    rating: 4.5,
    date: '20/06/2026',
    title: 'Dịch vụ tuyệt vời',
    content: 'Giao hàng nhanh, nhân viên tư vấn size chính xác. Blazer mặc vừa in, đứng form cả ngày làm việc.',
  },
  {
    id: 4,
    author: 'Lan Chi',
    avatar: 'https://i.pravatar.cc/100?img=25',
    rating: 5,
    date: '15/06/2026',
    title: 'Sẽ quay lại mua tiếp',
    content: 'Đầm lụa đẹp hơn cả hình. Chất lụa mềm, mát, lên dáng cực sang. Đáng từng đồng.',
  },
  {
    id: 5,
    author: 'Hữu Phước',
    avatar: 'https://i.pravatar.cc/100?img=68',
    rating: 4.8,
    date: '10/06/2026',
    title: 'Trải nghiệm mua sắm 5 sao',
    content: 'Website đẹp, dễ dùng, thanh toán nhanh. Sản phẩm đúng mô tả 100%. Rất đáng tin cậy.',
  },
]

export const ADDRESSES: Address[] = [
  {
    id: 1,
    label: 'Nhà riêng',
    name: 'Trần Duy',
    phone: '0901 234 567',
    street: '86 Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    isDefault: true,
  },
  {
    id: 2,
    label: 'Văn phòng',
    name: 'Trần Duy',
    phone: '0938 765 432',
    street: 'Tầng 12, Landmark 81, 720A Điện Biên Phủ',
    ward: 'Phường 22',
    district: 'Quận Bình Thạnh',
    city: 'TP. Hồ Chí Minh',
    isDefault: false,
  },
]

export const ORDERS: Order[] = [
  {
    id: 'HN-24081',
    date: '08/07/2026',
    status: 'shipping',
    items: [
      { name: 'Áo khoác dạ Oversized Wool', image: PRODUCTS[0].images[0], quantity: 1, price: PRODUCTS[0].price, size: 'M' },
      { name: 'Sơ mi Linen Premium Trắng', image: PRODUCTS[2].images[0], quantity: 2, price: PRODUCTS[2].price, size: 'L' },
    ],
    total: PRODUCTS[0].price + PRODUCTS[2].price * 2 + 30000,
    payment: 'VNPay',
  },
  {
    id: 'HN-23967',
    date: '25/06/2026',
    status: 'delivered',
    items: [{ name: 'Đầm lụa Midi Thanh Lịch', image: PRODUCTS[1].images[0], quantity: 1, price: PRODUCTS[1].price, size: 'S' }],
    total: PRODUCTS[1].price,
    payment: 'COD',
  },
  {
    id: 'HN-23712',
    date: '12/06/2026',
    status: 'delivered',
    items: [
      { name: 'Áo thun Cotton Supima Basic', image: PRODUCTS[5].images[0], quantity: 3, price: PRODUCTS[5].price, size: 'M' },
    ],
    total: PRODUCTS[5].price * 3,
    payment: 'Momo',
  },
  {
    id: 'HN-23408',
    date: '30/05/2026',
    status: 'cancelled',
    items: [{ name: 'Trench Coat Cổ Điển Beige', image: PRODUCTS[9].images[0], quantity: 1, price: PRODUCTS[9].price, size: 'L' }],
    total: PRODUCTS[9].price,
    payment: 'VNPay',
  },
]

export const VOUCHERS: Voucher[] = [
  { id: 1, code: 'HOANGNHA15', discount: '15%', description: 'Giảm 15% cho đơn hàng đầu tiên', expiry: '31/08/2026', minOrder: 500000, type: 'percent' },
  { id: 2, code: 'FREESHIP', discount: 'Freeship', description: 'Miễn phí vận chuyển toàn quốc', expiry: '31/12/2026', minOrder: 300000, type: 'freeship' },
  { id: 3, code: 'LUXURY100', discount: '100K', description: 'Giảm 100.000đ cho đơn từ 1 triệu', expiry: '15/09/2026', minOrder: 1000000, type: 'fixed' },
  { id: 4, code: 'VIPGOLD20', discount: '20%', description: 'Ưu đãi khách hàng thân thiết', expiry: '30/07/2026', minOrder: 800000, type: 'percent', used: true },
]

export const NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'Đơn hàng đang được giao', content: 'Đơn HN-24081 dự kiến giao vào ngày mai. Vui lòng chú ý điện thoại.', time: '2 giờ trước', read: false, type: 'order' },
  { id: 2, title: 'Flash Sale cuối tuần 🔥', content: 'Giảm đến 50% cho BST Thu-Đông. Chỉ trong 48 giờ!', time: '5 giờ trước', read: false, type: 'promo' },
  { id: 3, title: 'Đơn hàng đã giao thành công', content: 'Đơn HN-23967 đã được giao. Hãy đánh giá sản phẩm nhé!', time: '2 ngày trước', read: true, type: 'order' },
  { id: 4, title: 'Voucher sắp hết hạn', content: 'Voucher VIPGOLD20 sẽ hết hạn trong 3 ngày.', time: '3 ngày trước', read: true, type: 'promo' },
  { id: 5, title: 'Cập nhật chính sách đổi trả', content: 'Thời gian đổi trả tăng lên 30 ngày cho thành viên Gold.', time: '1 tuần trước', read: true, type: 'system' },
]

export const LOOKBOOK = [
  { id: 1, image: u('photo-1483985988355-763728e1935b', 1200), title: 'Urban Poetry', season: 'Thu — Đông 2026' },
  { id: 2, image: u('photo-1509631179647-0177331693ae', 1200), title: 'Silent Luxury', season: 'Capsule Collection' },
  { id: 3, image: u('photo-1524504388940-b1c1722653e1', 1200), title: 'Modern Muse', season: 'Xuân — Hè 2026' },
]

export const INSTAGRAM = [
  u('photo-1515886657613-9f3515b0c78f', 600),
  u('photo-1529139574466-a303027c1d8b', 600),
  u('photo-1487222477894-8943e31ef7b2', 600),
  u('photo-1539109136881-3be0616acf4b', 600),
  u('photo-1496747611176-843222e1e57c', 600),
  u('photo-1485968579580-b6d095142e6e', 600),
]

export const formatVND = (n: number) =>
  n.toLocaleString('vi-VN') + 'đ'

export const ORDER_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'text-warning bg-warning/10' },
  confirmed: { label: 'Đã xác nhận', color: 'text-blue-500 bg-blue-500/10' },
  shipping: { label: 'Đang giao', color: 'text-accent-dark bg-accent/15' },
  delivered: { label: 'Đã giao', color: 'text-success bg-success/10' },
  cancelled: { label: 'Đã hủy', color: 'text-danger bg-danger/10' },
}
