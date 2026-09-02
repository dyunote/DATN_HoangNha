/**
 * Nội dung tĩnh + helper hiển thị.
 *
 * KHÔNG đặt dữ liệu nghiệp vụ giả (sản phẩm, đơn hàng, khách hàng, voucher...)
 * ở đây nữa: tất cả những thứ đó lấy từ database qua API. Mock cũ đã bị xóa vì
 * nó âm thầm hiện lên khi backend lỗi, khiến giao diện trông như chạy tốt
 * trong khi thực tế không có dữ liệu nào.
 *
 * Những gì còn lại là ảnh marketing chưa có bảng trong DB (lookbook, feed
 * Instagram) và các hàm định dạng.
 */

import type { OrderStatus } from '@/types'

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

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

/**
 * Nhãn + màu của từng trạng thái đơn.
 * Danh sách trạng thái và các bước chuyển hợp lệ định nghĩa ở
 * `@/lib/orderStatus` (bản sao khớp backend/src/lib/orderStatus.ts).
 */
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'text-warning bg-warning/10' },
  confirmed: { label: 'Đã xác nhận', color: 'text-info bg-info/10' },
  preparing: { label: 'Đang chuẩn bị', color: 'text-indigo-500 bg-indigo-500/10' },
  shipping: { label: 'Đang giao', color: 'text-accent-dark bg-accent/15' },
  delivered: { label: 'Giao thành công', color: 'text-success bg-success/10' },
  delivery_failed: { label: 'Giao thất bại', color: 'text-orange-600 bg-orange-500/10' },
  returned: { label: 'Hoàn/Trả', color: 'text-purple-500 bg-purple-500/10' },
  cancelled: { label: 'Đã hủy', color: 'text-danger bg-danger/10' },
}
