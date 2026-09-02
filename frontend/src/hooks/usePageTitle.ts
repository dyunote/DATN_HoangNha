import { useEffect } from 'react'

/** Tên thương hiệu đứng sau mọi tiêu đề — đổi ở đây là đổi cả app */
const BRAND = 'Hoàng Nha Fashion'

/**
 * Đặt tiêu đề tab trình duyệt cho từng trang.
 *
 * VÌ SAO CẦN: trước đây không trang nào đụng tới `document.title`, nên cả 40
 * đường dẫn đều hiện đúng một cái tên. Mở 5 tab thì không biết tab nào là giỏ
 * hàng, tab nào là quản lý đơn; lưu bookmark cũng ra tên vô nghĩa; lịch sử
 * trình duyệt không tra lại được.
 *
 * Gọi ngay đầu mỗi trang: `usePageTitle('Thanh toán')`
 * → tab hiện "Thanh toán · Hoàng Nha Fashion".
 *
 * Trang có tiêu đề động (chi tiết sản phẩm) truyền tên lấy từ dữ liệu; lúc
 * chưa tải xong thì truyền chuỗi rỗng để tạm dùng tên thương hiệu.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND}` : BRAND
  }, [title])
}
