// Nguồn DUY NHẤT cho nhóm trang "Hỗ trợ".
// Footer, sidebar và hero của SupportLayout đều đọc từ đây — sửa 1 chỗ là đồng bộ
// cả 3 nơi, không còn cảnh link footer trỏ '#' còn route thì đã tồn tại.

export interface SupportNavItem {
  /** Tên hiện trên footer + sidebar */
  label: string
  /** Đường dẫn tiếng Việt không dấu, khớp với route trong App.tsx */
  to: string
  /** Mô tả ngắn hiện dưới tiêu đề trang (hero) */
  desc: string
}

export const SUPPORT_NAV: SupportNavItem[] = [
  {
    label: 'Hướng dẫn chọn size',
    to: '/huong-dan-chon-size',
    desc: 'Bảng size chuẩn Hoàng Nha, cách tự đo số đo và mẹo chọn dáng vừa vặn nhất.',
  },
  {
    label: 'Chính sách đổi trả',
    to: '/chinh-sach-doi-tra',
    desc: 'Điều kiện, thời hạn và các bước đổi trả sản phẩm — miễn phí đổi size lần đầu.',
  },
  {
    label: 'Chính sách bảo mật',
    to: '/chinh-sach-bao-mat',
    desc: 'Chúng tôi thu thập dữ liệu gì, dùng vào việc gì và bạn có quyền kiểm soát ra sao.',
  },
  {
    label: 'Phương thức thanh toán',
    to: '/phuong-thuc-thanh-toan',
    desc: 'COD, chuyển khoản QR, ví điện tử và thẻ quốc tế — chọn cách tiện nhất cho bạn.',
  },
  {
    label: 'Câu hỏi thường gặp',
    to: '/cau-hoi-thuong-gap',
    desc: 'Giải đáp nhanh về đơn hàng, vận chuyển, tài khoản và sản phẩm.',
  },
]
