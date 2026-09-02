import { Link } from 'react-router-dom'
import PolicyLayout, { PolicySection } from '@/components/support/PolicyLayout'
import { SHOP_CONTACT } from '@/lib/shop'
import Accordion, { type AccordionItem } from '@/components/ui/Accordion'
import { FREE_SHIP_THRESHOLD, SHIPPING_RATES } from '@/lib/shipping'
import { formatVND } from '@/data'
import { usePageTitle } from '@/hooks/usePageTitle'

/* Câu trả lời ở đây phải khớp với trợ lý chat (backend/src/lib/supportBot.ts)
 * và các trang chính sách — khách hỏi ở đâu cũng phải nhận cùng một đáp án. */

const ORDER_FAQ: AccordionItem[] = [
  {
    title: 'Đặt hàng có cần tài khoản không?',
    content: (
      <p>
        Có. Bạn cần đăng nhập để thêm sản phẩm vào giỏ và đặt hàng — nhờ vậy đơn hàng luôn gắn với đúng tài khoản, bạn
        tra cứu và hủy đơn được về sau. Đăng ký chỉ mất chưa tới một phút.
      </p>
    ),
  },
  {
    title: 'Tôi theo dõi đơn hàng ở đâu?',
    content: (
      <p>
        Vào{' '}
        <Link to="/tai-khoan/don-hang" className="link-underline text-accent">
          Tài khoản → Đơn hàng
        </Link>
        . Mỗi đơn hiện trạng thái hiện tại, mã vận đơn (khi đã bàn giao cho đơn vị giao hàng) và tình trạng thanh toán.
      </p>
    ),
  },
  {
    title: 'Tôi hủy đơn được không?',
    content: (
      <p>
        Đơn còn ở trạng thái "Chờ xác nhận" thì bạn tự hủy được trong Tài khoản → Đơn hàng. Đơn đã xác nhận hoặc đang
        chuẩn bị hàng thì gọi hotline {SHOP_CONTACT.hotline}, shop hủy giúp khi hàng chưa rời kho. Hủy đơn sẽ hoàn lại
        tồn kho và hoàn lại lượt dùng voucher.
      </p>
    ),
  },
  {
    title: 'Giỏ hàng của tôi có mất khi đổi máy không?',
    content: (
      <p>
        Không. Giỏ hàng và danh sách yêu thích được lưu theo tài khoản, nên đăng nhập ở điện thoại hay máy tính đều thấy
        cùng một giỏ. Đăng xuất thì giỏ được cất đi, người dùng máy sau không nhìn thấy.
      </p>
    ),
  },
]

const SHIPPING_FAQ: AccordionItem[] = [
  {
    title: 'Phí vận chuyển bao nhiêu?',
    content: (
      <p>
        Giao tiêu chuẩn {formatVND(SHIPPING_RATES.standard)} (3–5 ngày làm việc), giao hỏa tốc{' '}
        {formatVND(SHIPPING_RATES.express)} (1–2 ngày). Miễn phí giao tiêu chuẩn cho đơn từ{' '}
        {formatVND(FREE_SHIP_THRESHOLD)} hoặc khi dùng voucher freeship.
      </p>
    ),
  },
  {
    title: 'Shop giao tới những đâu?',
    content: <p>Toàn quốc. Thời gian trên là ngày làm việc, chưa tính ngày lễ và có thể lâu hơn ở vùng sâu vùng xa.</p>,
  },
  {
    title: 'Tôi có được kiểm tra hàng trước khi trả tiền không?',
    content: (
      <p>
        Có, với đơn COD bạn xem hàng trước rồi mới thanh toán cho nhân viên giao hàng. Nếu hàng giao sai hoặc hư hỏng,
        bạn có quyền từ chối nhận.
      </p>
    ),
  },
]

const PAYMENT_FAQ: AccordionItem[] = [
  {
    title: 'Có mấy cách thanh toán?',
    content: (
      <p>
        Hai cách: COD (trả tiền khi nhận hàng) và chuyển khoản QR ngân hàng. Xem chi tiết ở{' '}
        <Link to="/phuong-thuc-thanh-toan" className="link-underline text-accent">
          Phương thức thanh toán
        </Link>
        .
      </p>
    ),
  },
  {
    title: 'Tôi chuyển khoản rồi mà đơn chưa cập nhật?',
    content: (
      <p>
        Hệ thống tự đối chiếu trong vài giây, bạn không cần gửi ảnh chuyển khoản. Nếu sau vài phút đơn vẫn chưa đổi
        trạng thái, khả năng cao là nội dung chuyển khoản đã bị sửa — gọi hotline {SHOP_CONTACT.hotline} kèm mã đơn,
        shop xác nhận thủ công giúp bạn.
      </p>
    ),
  },
  {
    title: 'Mã QR hết hạn thì sao?',
    content: <p>Mã có hiệu lực 15 phút. Quá hạn, bạn đặt lại đơn mới hoặc chọn COD — hàng chưa bị mất chỗ.</p>,
  },
  {
    title: 'Vì sao mã giảm giá của tôi không áp được?',
    content: (
      <p>
        Thường do một trong ba lý do: đơn chưa đạt giá trị tối thiểu của mã, mã đã hết lượt hoặc hết hạn, hoặc bạn đã
        dùng mã đó rồi (mỗi mã một lượt cho mỗi khách). Danh sách mã đang chạy nằm ở nút "Chọn voucher có sẵn" trong{' '}
        <Link to="/gio-hang" className="link-underline text-accent">
          giỏ hàng
        </Link>
        .
      </p>
    ),
  },
]

const PRODUCT_FAQ: AccordionItem[] = [
  {
    title: 'Chọn size thế nào cho đúng?',
    content: (
      <p>
        Xem{' '}
        <Link to="/huong-dan-chon-size" className="link-underline text-accent">
          hướng dẫn chọn size
        </Link>{' '}
        — có bảng số đo và gợi ý khi phân vân giữa hai size.
      </p>
    ),
  },
  {
    title: 'Vì sao size tôi cần lại không bấm được?',
    content: (
      <p>
        Tồn kho tính riêng cho từng tổ hợp màu × size. Size bị làm mờ nghĩa là màu bạn đang chọn đã hết size đó — thử
        đổi sang màu khác, có thể vẫn còn.
      </p>
    ),
  },
  {
    title: 'Sao sản phẩm giảm giá lại không có nhãn "NEW"?',
    content: (
      <p>
        Vì hai nhãn đó loại trừ nhau: hàng mới về thì bán đúng giá, còn hàng đang giảm giá thì không còn được xem là mới
        về nữa. Nhãn "NEW" cũng tự ẩn sau 30 ngày kể từ khi sản phẩm lên kệ.
      </p>
    ),
  },
  {
    title: 'Ai được viết đánh giá sản phẩm?',
    content: (
      <p>
        Chỉ khách đã thực sự mua và nhận hàng thành công, và mỗi lượt mua đánh giá được một lần. Nhờ vậy đánh giá bạn
        đọc trên web đều gắn với đơn hàng có thật.
      </p>
    ),
  },
]

export default function Faq() {
  usePageTitle('Câu hỏi thường gặp')
  return (
    <PolicyLayout
      eyebrow="Hỗ trợ"
      title="Câu hỏi thường gặp"
      lead="Những câu khách hỏi nhiều nhất, gom theo nhóm. Không thấy câu của bạn ở đây thì gọi hotline hoặc nhắn cho trợ lý ở góc màn hình."
    >
      <PolicySection title="Đặt hàng & tài khoản">
        <Accordion items={ORDER_FAQ} />
      </PolicySection>
      <PolicySection title="Vận chuyển">
        <Accordion items={SHIPPING_FAQ} defaultOpen={-1} />
      </PolicySection>
      <PolicySection title="Thanh toán & voucher">
        <Accordion items={PAYMENT_FAQ} defaultOpen={-1} />
      </PolicySection>
      <PolicySection title="Sản phẩm & đánh giá">
        <Accordion items={PRODUCT_FAQ} defaultOpen={-1} />
      </PolicySection>
      <PolicySection title="Vẫn chưa có câu trả lời?">
        <p>
          Gọi {SHOP_CONTACT.hotline} ({SHOP_CONTACT.hours}), email {SHOP_CONTACT.email}, hoặc xem thêm{' '}
          <Link to="/chinh-sach-doi-tra" className="link-underline text-accent">
            chính sách đổi trả
          </Link>{' '}
          và{' '}
          <Link to="/chinh-sach-bao-mat" className="link-underline text-accent">
            chính sách bảo mật
          </Link>
          .
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
