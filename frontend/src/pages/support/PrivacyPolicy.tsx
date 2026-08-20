import { Section, CheckList, Note, DataTable } from '@/components/support/Prose'
import { useSettings } from '@/context/SettingsContext'

export default function PrivacyPolicy() {
  const { settings } = useSettings()

  return (
    <>
      <Section index={1} title="Chúng tôi thu thập những gì">
        <DataTable
          head={['Nhóm dữ liệu', 'Ví dụ', 'Khi nào thu thập']}
          rows={[
            ['Thông tin tài khoản', 'Họ tên, email, số điện thoại, mật khẩu đã mã hóa', 'Khi bạn đăng ký'],
            ['Thông tin giao hàng', 'Địa chỉ nhận hàng, ghi chú cho shipper', 'Khi bạn đặt hàng'],
            ['Lịch sử mua sắm', 'Đơn hàng, sản phẩm yêu thích, đánh giá', 'Trong quá trình sử dụng'],
            ['Dữ liệu kỹ thuật', 'Loại thiết bị, trình duyệt, trang đã xem', 'Tự động khi bạn truy cập'],
          ]}
        />
        <Note>
          Hoàng Nha <strong>không lưu số thẻ ngân hàng</strong> của bạn. Mọi giao dịch thẻ được xử lý trực tiếp trên cổng
          thanh toán đạt chuẩn PCI-DSS; hệ thống của chúng tôi chỉ nhận lại kết quả giao dịch thành công hay thất bại.
        </Note>
      </Section>

      <Section index={2} title="Dùng dữ liệu để làm gì">
        <CheckList
          items={[
            'Xử lý đơn hàng: xác nhận, đóng gói, giao hàng và hỗ trợ đổi trả.',
            'Chăm sóc khách hàng: trả lời câu hỏi, xử lý khiếu nại.',
            'Gợi ý sản phẩm phù hợp với lịch sử xem và mua của bạn.',
            'Gửi email khuyến mãi — chỉ khi bạn đã đăng ký nhận tin, và luôn có nút hủy đăng ký.',
            'Phát hiện gian lận, đơn ảo và bảo vệ tài khoản người dùng.',
          ]}
        />
        <p>
          Chúng tôi <strong className="text-ink dark:text-white">không bán, không cho thuê</strong> dữ liệu cá nhân của
          bạn cho bên thứ ba vì mục đích quảng cáo.
        </p>
      </Section>

      <Section index={3} title="Ai được tiếp cận dữ liệu">
        <p>Dữ liệu chỉ được chia sẻ ở mức tối thiểu cần thiết với:</p>
        <CheckList
          items={[
            'Đơn vị vận chuyển — nhận tên, số điện thoại, địa chỉ để giao hàng.',
            'Cổng thanh toán — nhận mã đơn và số tiền để xử lý giao dịch.',
            'Nhà cung cấp dịch vụ email/SMS — để gửi thông báo trạng thái đơn hàng.',
            'Cơ quan nhà nước có thẩm quyền — khi có yêu cầu hợp pháp bằng văn bản.',
          ]}
        />
      </Section>

      <Section index={4} title="Chúng tôi bảo vệ dữ liệu thế nào">
        <CheckList
          items={[
            'Toàn bộ kết nối tới website đều mã hóa HTTPS/TLS.',
            'Mật khẩu được băm một chiều — kể cả quản trị viên cũng không đọc được.',
            'Phân quyền chặt chẽ: nhân viên chỉ thấy dữ liệu cần cho công việc của mình.',
            'Sao lưu định kỳ và ghi nhật ký mọi thao tác quản trị nhạy cảm.',
          ]}
        />
      </Section>

      <Section index={5} title="Cookie">
        <p>
          Website dùng cookie để giữ bạn đăng nhập, nhớ giỏ hàng và ghi nhận lựa chọn giao diện sáng/tối. Bạn có thể xóa
          hoặc chặn cookie trong cài đặt trình duyệt, nhưng khi đó giỏ hàng và trạng thái đăng nhập sẽ không được lưu.
        </p>
      </Section>

      <Section index={6} title="Quyền của bạn">
        <CheckList
          items={[
            'Xem và chỉnh sửa thông tin cá nhân trong mục Tài khoản → Thông tin.',
            'Yêu cầu bản sao dữ liệu mà chúng tôi đang lưu về bạn.',
            'Yêu cầu xóa tài khoản và dữ liệu liên quan (trừ dữ liệu hóa đơn phải lưu theo luật kế toán).',
            'Hủy nhận email khuyến mãi bất cứ lúc nào.',
          ]}
        />
        <p>
          Để thực hiện các quyền trên, gửi email tới{' '}
          <strong className="text-ink dark:text-white">{settings.contact_email}</strong> hoặc gọi{' '}
          <strong className="text-ink dark:text-white">{settings.hotline}</strong>. Chúng tôi phản hồi trong tối đa 7
          ngày làm việc.
        </p>
      </Section>
    </>
  )
}
