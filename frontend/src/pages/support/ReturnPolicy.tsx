import { Link } from 'react-router-dom'
import { Section, CheckList, Note, DataTable } from '@/components/support/Prose'
import { useSettings } from '@/context/SettingsContext'

const STEPS = [
  { title: 'Gửi yêu cầu', desc: 'Vào Tài khoản → Đơn hàng, chọn đơn cần đổi trả và bấm "Yêu cầu đổi/trả". Hoặc nhắn hotline kèm mã đơn.' },
  { title: 'Xác nhận trong 24h', desc: 'Nhân viên kiểm tra điều kiện và phản hồi qua điện thoại/email, kèm hướng dẫn đóng gói.' },
  { title: 'Gửi hàng về', desc: 'Bạn gửi qua đơn vị vận chuyển bất kỳ, hoặc chọn để Hoàng Nha đặt shipper tới lấy tận nơi.' },
  { title: 'Kiểm tra & xử lý', desc: 'Trong 2 – 3 ngày làm việc kể từ khi nhận hàng, chúng tôi gửi sản phẩm mới hoặc hoàn tiền.' },
]

export default function ReturnPolicy() {
  const { settings } = useSettings()

  return (
    <>
      <Section index={1} title="Tóm tắt nhanh">
        <DataTable
          head={['Trường hợp', 'Thời hạn', 'Phí vận chuyển']}
          rows={[
            ['Đổi size / đổi màu (lần đầu)', '7 ngày kể từ khi nhận hàng', 'Miễn phí'],
            ['Đổi sang sản phẩm khác', '7 ngày', 'Khách trả phí chiều gửi về'],
            ['Sản phẩm lỗi, sai mẫu, thiếu hàng', '15 ngày', 'Hoàng Nha chịu toàn bộ'],
            ['Trả hàng hoàn tiền', '7 ngày', 'Khách trả phí chiều gửi về'],
          ]}
        />
      </Section>

      <Section index={2} title="Điều kiện được đổi trả">
        <CheckList
          items={[
            'Sản phẩm còn nguyên tem, mác, chưa qua sử dụng và chưa giặt là.',
            'Còn đầy đủ phụ kiện đi kèm, túi/hộp đựng ban đầu nếu có.',
            'Không dính bẩn, mùi lạ (nước hoa, khói thuốc), không rách hay biến dạng.',
            'Có hóa đơn hoặc mã đơn hàng để đối chiếu.',
          ]}
        />
        <Note tone="danger">
          <strong>Không áp dụng đổi trả</strong> với: đồ lót, đồ bơi, tất/vớ (lý do vệ sinh); sản phẩm trong chương trình
          thanh lý ghi rõ "không đổi trả"; và sản phẩm đặt may/thêu tên theo yêu cầu riêng.
        </Note>
      </Section>

      <Section index={3} title="Quy trình 4 bước">
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-dark">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-ink dark:text-white">{s.title}</p>
                <p className="mt-1">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section index={4} title="Hoàn tiền">
        <p>
          Số tiền hoàn bằng giá trị thực tế bạn đã thanh toán cho sản phẩm (đã trừ voucher giảm giá đã dùng). Thời gian
          nhận tiền tùy phương thức thanh toán ban đầu:
        </p>
        <DataTable
          head={['Đã thanh toán bằng', 'Hoàn về', 'Thời gian dự kiến']}
          rows={[
            ['COD / chuyển khoản', 'Tài khoản ngân hàng bạn cung cấp', '1 – 3 ngày làm việc'],
            ['Ví MoMo / ZaloPay', 'Chính ví đã thanh toán', '1 – 2 ngày làm việc'],
            ['Thẻ Visa / Mastercard', 'Chính thẻ đã thanh toán', '5 – 15 ngày (tùy ngân hàng)'],
          ]}
        />
        <p className="text-xs text-slate-400">
          Phí vận chuyển của đơn ban đầu không được hoàn, trừ trường hợp lỗi từ phía Hoàng Nha.
        </p>
      </Section>

      <Section index={5} title="Cần hỗ trợ thêm?">
        <p>
          Gọi hotline <strong className="text-ink dark:text-white">{settings.hotline}</strong> (8:00 – 21:00 hằng ngày)
          hoặc email <strong className="text-ink dark:text-white">{settings.contact_email}</strong>. Bạn cũng có thể xem{' '}
          <Link to="/cau-hoi-thuong-gap" className="link-underline font-semibold text-ink dark:text-white">
            Câu hỏi thường gặp
          </Link>{' '}
          để được giải đáp ngay.
        </p>
      </Section>
    </>
  )
}
