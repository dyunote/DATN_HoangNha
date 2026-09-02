import { Link } from 'react-router-dom'
import { Banknote, QrCode } from 'lucide-react'
import PolicyLayout, { PolicyList, PolicySection } from '@/components/support/PolicyLayout'
import { FREE_SHIP_THRESHOLD, SHIPPING_RATES } from '@/lib/shipping'
import { formatVND } from '@/data'
import { usePageTitle } from '@/hooks/usePageTitle'

/* Biểu phí lấy thẳng từ @/lib/shipping — trang này và ô "tạm tính" ở giỏ hàng
 * luôn hiện cùng một con số, không sợ sửa một nơi quên nơi kia. */
const SHIPPING_ROWS = [
  { name: 'Giao tiêu chuẩn', time: '3 – 5 ngày làm việc', fee: SHIPPING_RATES.standard },
  { name: 'Giao hỏa tốc', time: '1 – 2 ngày làm việc', fee: SHIPPING_RATES.express },
]

export default function PaymentMethods() {
  usePageTitle('Phương thức thanh toán')
  return (
    <PolicyLayout
      eyebrow="Hỗ trợ"
      title="Phương thức thanh toán"
      lead="Hoàng Nha nhận hai hình thức: thanh toán khi nhận hàng (COD) và chuyển khoản QR ngân hàng. Không thu thêm phụ phí cho cả hai."
    >
      <PolicySection title="Hai cách thanh toán">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-slate-200 p-5 dark:border-white/10">
            <Banknote size={20} className="text-accent" />
            <p className="mt-3 text-sm font-semibold dark:text-white">Thanh toán khi nhận hàng (COD)</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Kiểm tra hàng trước, trả tiền mặt cho nhân viên giao hàng sau. Không cần trả trước đồng nào khi đặt.
            </p>
          </div>
          <div className="rounded-card border border-slate-200 p-5 dark:border-white/10">
            <QrCode size={20} className="text-accent" />
            <p className="mt-3 text-sm font-semibold dark:text-white">Chuyển khoản QR (VietQR)</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Quét mã bằng app ngân hàng bất kỳ. Hệ thống tự đối chiếu và xác nhận trong vài giây, bạn không phải gửi
              ảnh chuyển khoản cho ai cả.
            </p>
          </div>
        </div>
      </PolicySection>

      <PolicySection title="Chuyển khoản QR hoạt động thế nào">
        <PolicyList
          items={[
            'Đặt hàng xong, màn hình hiện mã QR kèm số tài khoản, số tiền và nội dung chuyển khoản đã điền sẵn.',
            <>
              <b className="dark:text-white">Giữ nguyên nội dung chuyển khoản</b> — đó là mã đối chiếu đơn của bạn. Sửa
              nội dung thì hệ thống không tự khớp được và đơn sẽ phải chờ shop xác nhận thủ công.
            </>,
            'Mã QR có hiệu lực 15 phút. Chuyển xong, trang tự chuyển sang "Đã nhận thanh toán" mà không cần tải lại.',
            'Quá 15 phút chưa chuyển: bạn đặt lại đơn mới, hoặc chọn COD cho tiện.',
            'Hàng đã được giữ ngay khi đơn được tạo, nên không lo hết size trong lúc bạn chuyển khoản.',
          ]}
        />
      </PolicySection>

      <PolicySection title="Phí vận chuyển">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[26rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-white/10">
                {['Hình thức', 'Thời gian dự kiến', 'Phí'].map((h) => (
                  <th key={h} className="label-field py-3 pr-4 font-semibold text-slate-500 dark:text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIPPING_ROWS.map((r) => (
                <tr key={r.name} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                  <td className="py-3 pr-4 font-medium dark:text-white">{r.name}</td>
                  <td className="py-3 pr-4">{r.time}</td>
                  <td className="py-3 pr-4">{formatVND(r.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <b className="dark:text-white">Miễn phí giao tiêu chuẩn</b> cho đơn từ {formatVND(FREE_SHIP_THRESHOLD)}, hoặc
          khi bạn dùng voucher freeship. Phí ship cuối cùng luôn được máy chủ tính lại lúc đặt hàng, đúng bằng con số
          hiện ở bước thanh toán.
        </p>
      </PolicySection>

      <PolicySection title="Mã giảm giá">
        <PolicyList
          items={[
            <>
              Nhập mã ở trang <Link to="/gio-hang" className="link-underline text-accent">Giỏ hàng</Link> hoặc bước Thanh
              toán — hoặc bấm "Chọn voucher có sẵn" để xem mã đang chạy.
            </>,
            'Mỗi mã dùng một lần cho mỗi khách, và mỗi đơn chỉ áp được một mã.',
            'Voucher có thể kèm điều kiện đơn tối thiểu; số tiền giảm do máy chủ tính, không phải client.',
            'Hủy đơn thì lượt dùng mã được hoàn lại, bạn dùng cho đơn sau bình thường.',
          ]}
        />
      </PolicySection>

      <PolicySection title="An toàn thanh toán">
        <p>
          Shop <b className="dark:text-white">không lưu và không bao giờ hỏi</b> số thẻ, mã OTP hay mật khẩu ngân hàng
          của bạn. Toàn bộ thao tác chuyển tiền diễn ra trong app ngân hàng của chính bạn — website chỉ nhận thông báo
          "đã nhận được tiền" để cập nhật đơn.
        </p>
        <p>
          Chi tiết dữ liệu shop lưu giữ, xem{' '}
          <Link to="/chinh-sach-bao-mat" className="link-underline text-accent">
            chính sách bảo mật
          </Link>
          .
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
