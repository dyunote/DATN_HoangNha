import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import Accordion, { type AccordionItem } from '@/components/ui/Accordion'
import EmptyState from '@/components/ui/EmptyState'
import { Section } from '@/components/support/Prose'
import { useSettings } from '@/context/SettingsContext'

interface Faq {
  group: string
  q: string
  a: string
}

const FAQS: Faq[] = [
  {
    group: 'Đơn hàng',
    q: 'Làm sao kiểm tra tình trạng đơn hàng?',
    a: 'Đăng nhập rồi vào Tài khoản → Đơn hàng, mỗi đơn đều hiển thị trạng thái hiện tại và mã vận đơn. Chúng tôi cũng gửi email mỗi khi đơn chuyển trạng thái.',
  },
  {
    group: 'Đơn hàng',
    q: 'Tôi có thể sửa hoặc hủy đơn sau khi đặt không?',
    a: 'Được, khi đơn vẫn ở trạng thái "Chờ xác nhận". Vào Tài khoản → Đơn hàng để hủy, hoặc gọi hotline để nhờ sửa địa chỉ. Khi đơn đã bàn giao cho vận chuyển thì không sửa được nữa.',
  },
  {
    group: 'Đơn hàng',
    q: 'Đặt hàng có bắt buộc tạo tài khoản không?',
    a: 'Có. Tài khoản giúp bạn theo dõi đơn, lưu địa chỉ, tích điểm hạng thành viên và yêu cầu đổi trả chỉ với vài cú bấm. Đăng ký chỉ mất khoảng 30 giây.',
  },
  {
    group: 'Vận chuyển',
    q: 'Bao lâu thì tôi nhận được hàng?',
    a: 'Nội thành TP.HCM và Hà Nội thường 1 – 2 ngày; các tỉnh khác 2 – 5 ngày làm việc. Đơn đặt sau 16h sẽ được xử lý vào ngày làm việc kế tiếp.',
  },
  {
    group: 'Vận chuyển',
    q: 'Khi nào được miễn phí vận chuyển?',
    a: 'Đơn hàng đạt ngưỡng miễn phí ship (xem trang Phương thức thanh toán) với gói tiêu chuẩn, hoặc khi bạn áp voucher loại freeship.',
  },
  {
    group: 'Vận chuyển',
    q: 'Tôi có được kiểm tra hàng trước khi trả tiền không?',
    a: 'Bạn được kiểm tra bên ngoài kiện hàng: đúng số lượng, bao bì nguyên vẹn. Việc mở thử và mặc thử được thực hiện sau khi nhận hàng — nếu không vừa, bạn dùng chính sách đổi trả 7 ngày.',
  },
  {
    group: 'Sản phẩm',
    q: 'Làm sao biết mình mặc size nào?',
    a: 'Xem trang Hướng dẫn chọn size để tự đo và đối chiếu bảng size. Nếu vẫn phân vân, nhắn số đo qua khung chat, nhân viên sẽ tư vấn trong vài phút.',
  },
  {
    group: 'Sản phẩm',
    q: 'Sản phẩm hết hàng thì bao giờ có lại?',
    a: 'Các mẫu bán chạy thường được bổ sung sau 2 – 3 tuần. Bạn có thể thêm sản phẩm vào Yêu thích để nhận thông báo khi có hàng lại.',
  },
  {
    group: 'Sản phẩm',
    q: 'Hình ảnh trên web có đúng màu thật không?',
    a: 'Ảnh được chụp trong studio với ánh sáng tiêu chuẩn và hạn chế chỉnh màu. Tuy nhiên màu hiển thị có thể lệch nhẹ tùy màn hình của bạn. Lệch màu đáng kể so với mô tả được tính là hàng lỗi và đổi trả miễn phí.',
  },
  {
    group: 'Tài khoản & Voucher',
    q: 'Tôi quên mật khẩu, phải làm sao?',
    a: 'Bấm "Quên mật khẩu" ở trang đăng nhập, nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.',
  },
  {
    group: 'Tài khoản & Voucher',
    q: 'Một đơn hàng dùng được mấy voucher?',
    a: 'Mỗi đơn áp dụng một mã giảm giá. Voucher freeship và voucher giảm giá không cộng dồn với nhau.',
  },
  {
    group: 'Tài khoản & Voucher',
    q: 'Hạng thành viên có lợi ích gì?',
    a: 'Tổng chi tiêu càng cao thì hạng càng cao, đi kèm mức giảm giá riêng và voucher sinh nhật. Xem hạng hiện tại trong Tài khoản → Tổng quan.',
  },
]

const GROUPS = ['Tất cả', ...Array.from(new Set(FAQS.map((f) => f.group)))]

export default function Faq() {
  const [group, setGroup] = useState('Tất cả')
  const [keyword, setKeyword] = useState('')

  // Lọc theo nhóm + từ khóa. useMemo để không tính lại mỗi lần render vặt.
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return FAQS.filter(
      (f) =>
        (group === 'Tất cả' || f.group === group) &&
        (kw === '' || f.q.toLowerCase().includes(kw) || f.a.toLowerCase().includes(kw)),
    )
  }, [group, keyword])

  const items: AccordionItem[] = filtered.map((f) => ({ title: f.q, content: f.a }))
  const { settings } = useSettings()

  return (
    <>
      <div className="space-y-5">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm câu hỏi, ví dụ: đổi size, phí ship..."
            className="w-full rounded-input border border-slate-200 bg-white py-3.5 pr-4 pl-11 text-sm outline-none transition-colors focus:border-accent dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`cursor-pointer rounded-btn px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
                g === group
                  ? 'bg-ink text-white dark:bg-white dark:text-ink'
                  : 'border border-slate-200 text-slate-500 hover:border-ink hover:text-ink dark:border-white/15 dark:text-slate-400 dark:hover:border-white dark:hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {items.length > 0 ? (
          // key ép Accordion dựng lại khi đổi bộ lọc, tránh giữ nhầm mục đang mở của danh sách cũ
          <Accordion key={`${group}-${keyword}`} items={items} defaultOpen={0} />
        ) : (
          <EmptyState
            icon={<Search size={32} />}
            title="Không tìm thấy câu hỏi phù hợp"
            description="Thử từ khóa khác, hoặc liên hệ trực tiếp để được hỗ trợ nhanh."
          />
        )}
      </div>

      <Section title="Vẫn cần trợ giúp?">
        <p>
          Gọi <strong className="text-ink dark:text-white">{settings.hotline}</strong> (8:00 – 21:00 hằng ngày), email{' '}
          <strong className="text-ink dark:text-white">{settings.contact_email}</strong>, hoặc nhắn qua khung chat ở góc
          phải màn hình. Các trang{' '}
          <Link to="/chinh-sach-doi-tra" className="link-underline font-semibold text-ink dark:text-white">
            Chính sách đổi trả
          </Link>{' '}
          và{' '}
          <Link to="/huong-dan-chon-size" className="link-underline font-semibold text-ink dark:text-white">
            Hướng dẫn chọn size
          </Link>{' '}
          cũng giải đáp phần lớn thắc mắc thường gặp.
        </p>
      </Section>
    </>
  )
}
