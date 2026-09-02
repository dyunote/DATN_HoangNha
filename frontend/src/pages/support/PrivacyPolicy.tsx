import { Link } from 'react-router-dom'
import PolicyLayout, { PolicyList, PolicySection } from '@/components/support/PolicyLayout'
import { SHOP_CONTACT } from '@/lib/shop'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function PrivacyPolicy() {
  usePageTitle('Chính sách bảo mật')
  return (
    <PolicyLayout
      eyebrow="Chính sách"
      title="Chính sách bảo mật"
      lead="Trang này nói rõ Hoàng Nha lưu những thông tin gì của bạn, lưu để làm gì, và bạn kiểm soát chúng bằng cách nào."
    >
      <PolicySection title="Thông tin shop lưu">
        <PolicyList
          items={[
            <>
              <b className="dark:text-white">Tài khoản:</b> họ tên, email, số điện thoại, ảnh đại diện, giới tính và
              ngày sinh nếu bạn tự điền.
            </>,
            <>
              <b className="dark:text-white">Sổ địa chỉ:</b> tên người nhận, số điện thoại và địa chỉ giao hàng bạn lưu
              lại để đặt hàng nhanh hơn.
            </>,
            <>
              <b className="dark:text-white">Đơn hàng:</b> sản phẩm đã mua, số tiền, trạng thái giao hàng và trạng thái
              thanh toán.
            </>,
            <>
              <b className="dark:text-white">Giỏ hàng và danh sách yêu thích:</b> lưu theo tài khoản để bạn mở ở điện
              thoại hay máy tính đều thấy cùng một giỏ.
            </>,
            <>
              <b className="dark:text-white">Đánh giá sản phẩm</b> bạn viết, hiển thị công khai kèm tên và ảnh đại diện.
            </>,
          ]}
        />
      </PolicySection>

      <PolicySection title="Những thứ shop KHÔNG lưu">
        <PolicyList
          items={[
            'Số thẻ ngân hàng, mã CVV, mã OTP hay mật khẩu ngân hàng — việc chuyển tiền diễn ra hoàn toàn trong app ngân hàng của bạn.',
            'Mật khẩu dạng đọc được: mật khẩu được băm (bcrypt) trước khi lưu, kể cả quản trị viên cũng không xem lại được.',
            'Shop không cài mã theo dõi quảng cáo của bên thứ ba trên website.',
          ]}
        />
      </PolicySection>

      <PolicySection title="Dùng thông tin để làm gì">
        <PolicyList
          items={[
            'Xử lý đơn hàng: soạn hàng, xuất đơn, giao tới đúng địa chỉ và liên hệ khi cần xác nhận.',
            'Hiển thị lịch sử đơn, cho phép bạn tra cứu và hủy đơn khi đơn còn chờ xác nhận.',
            'Gửi thông báo trong tài khoản về trạng thái đơn, voucher và phản hồi đánh giá.',
            'Hỗ trợ khi bạn gọi hotline hoặc nhắn cho trợ lý — nhân viên cần mã đơn để tra đúng đơn của bạn.',
          ]}
        />
      </PolicySection>

      <PolicySection title="Chia sẻ với ai">
        <p>
          Shop <b className="dark:text-white">không bán, không trao đổi</b> dữ liệu khách hàng. Thông tin chỉ được chia
          sẻ trong đúng phạm vi cần thiết:
        </p>
        <PolicyList
          items={[
            'Đơn vị vận chuyển: tên, số điện thoại và địa chỉ người nhận — để giao được hàng.',
            'Ngân hàng / cổng đối soát chuyển khoản: số tiền và mã đơn, dùng để xác nhận đã nhận được tiền.',
            'Cơ quan nhà nước có thẩm quyền, khi có yêu cầu hợp pháp bằng văn bản.',
          ]}
        />
      </PolicySection>

      <PolicySection title="Dữ liệu lưu trên trình duyệt của bạn">
        <p>Website chỉ dùng bộ nhớ trình duyệt cho những việc tối thiểu sau:</p>
        <PolicyList
          items={[
            'Phiên đăng nhập (token) — để bạn không phải đăng nhập lại mỗi lần mở web.',
            'Lựa chọn giao diện sáng/tối, và danh sách sản phẩm bạn vừa xem.',
            'Một bản sao giỏ hàng và danh sách yêu thích, để nếu mất mạng thì màn hình không bị trắng.',
          ]}
        />
        <p>
          Đăng xuất là những dữ liệu gắn với phiên bị xóa khỏi trình duyệt ngay, người dùng máy sau không thấy giỏ hàng
          hay danh sách yêu thích của bạn.
        </p>
      </PolicySection>

      <PolicySection title="Quyền của bạn">
        <PolicyList
          items={[
            <>
              <b className="dark:text-white">Xem và sửa</b> thông tin cá nhân tại{' '}
              <Link to="/tai-khoan/thong-tin" className="link-underline text-accent">
                Tài khoản → Thông tin cá nhân
              </Link>
              .
            </>,
            <>
              <b className="dark:text-white">Đổi mật khẩu</b> bất cứ lúc nào tại{' '}
              <Link to="/tai-khoan/mat-khau" className="link-underline text-accent">
                Tài khoản → Đổi mật khẩu
              </Link>
              .
            </>,
            <>
              <b className="dark:text-white">Thêm, sửa, xóa</b> địa chỉ nhận hàng tại{' '}
              <Link to="/tai-khoan/dia-chi" className="link-underline text-accent">
                Sổ địa chỉ
              </Link>
              .
            </>,
            <>
              <b className="dark:text-white">Yêu cầu xóa tài khoản</b> và dữ liệu liên quan: gửi email tới{' '}
              {SHOP_CONTACT.email} từ chính địa chỉ đã đăng ký. Lưu ý các đơn đã phát sinh vẫn phải giữ lại theo quy định
              về hóa đơn, chứng từ.
            </>,
          ]}
        />
      </PolicySection>

      <PolicySection title="Liên hệ về quyền riêng tư">
        <p>
          Mọi thắc mắc hoặc yêu cầu liên quan tới dữ liệu cá nhân, gọi {SHOP_CONTACT.hotline} ({SHOP_CONTACT.hours})
          hoặc email {SHOP_CONTACT.email}.
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
