import { Link } from 'react-router-dom'
import PolicyLayout, { PolicyList, PolicySection } from '@/components/support/PolicyLayout'
import { SHOP_CONTACT } from '@/lib/shop'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function ReturnPolicy() {
  usePageTitle('Chính sách đổi trả')
  return (
    <PolicyLayout
      eyebrow="Chính sách"
      title="Chính sách đổi trả"
      lead="Đổi trả trong 7 ngày kể từ khi nhận hàng, với sản phẩm còn nguyên tem mác và chưa qua sử dụng. Dưới đây là các trường hợp cụ thể và cách thực hiện."
    >
      <PolicySection title="Điều kiện đổi trả">
        <PolicyList
          items={[
            <>
              Trong vòng <b className="dark:text-white">7 ngày</b> kể từ ngày nhận hàng.
            </>,
            'Sản phẩm còn nguyên tem, mác, chưa giặt, chưa qua sử dụng và không có mùi lạ (nước hoa, khói thuốc).',
            'Còn đầy đủ phụ kiện đi kèm và bao bì của sản phẩm.',
            <>
              Có mã đơn hàng — xem ở{' '}
              <Link to="/tai-khoan/don-hang" className="link-underline text-accent">
                Tài khoản → Đơn hàng
              </Link>
              .
            </>,
          ]}
        />
      </PolicySection>

      <PolicySection title="Shop chịu phí đổi trả khi">
        <PolicyList
          items={[
            'Giao sai sản phẩm, sai màu hoặc sai size so với đơn đặt.',
            'Sản phẩm có lỗi từ nhà sản xuất: đường may bung, lỗi vải, khóa kéo hỏng.',
            'Sản phẩm hư hỏng trong quá trình vận chuyển.',
          ]}
        />
        <p>
          Với các trường hợp này, bạn quay lại video/ảnh lúc mở kiện hàng nếu có — sẽ giúp shop xử lý nhanh hơn nhiều.
        </p>
      </PolicySection>

      <PolicySection title="Khách chịu phí vận chuyển khi">
        <PolicyList
          items={[
            'Đổi size hoặc đổi màu do chọn nhầm, sản phẩm vẫn đúng như đơn đặt.',
            'Đổi sang sản phẩm khác — phần chênh lệch giá sẽ được tính lại theo giá tại thời điểm đổi.',
          ]}
        />
      </PolicySection>

      <PolicySection title="Các bước thực hiện">
        <div className="space-y-3">
          {[
            ['1', 'Kiểm tra đơn', <>Vào <Link to="/tai-khoan/don-hang" className="link-underline text-accent">Tài khoản → Đơn hàng</Link> và ghi lại mã đơn (dạng HN-yymmdd-xxxx).</>],
            ['2', 'Liên hệ shop', <>Gọi {SHOP_CONTACT.hotline} ({SHOP_CONTACT.hours}) hoặc email {SHOP_CONTACT.email}, kèm mã đơn, ảnh sản phẩm và lý do đổi trả.</>],
            ['3', 'Gửi hàng về', 'Shop xác nhận rồi hướng dẫn địa chỉ gửi. Vui lòng đóng gói như lúc nhận để hàng không hỏng dọc đường.'],
            ['4', 'Nhận hàng mới / hoàn tiền', 'Sau khi shop nhận và kiểm tra hàng, đơn đổi được gửi đi hoặc tiền được hoàn lại theo cách bạn đã thanh toán.'],
          ].map(([step, title, body]) => (
            <div key={String(step)} className="flex gap-4 rounded-card border border-slate-200 p-4 dark:border-white/10">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white dark:bg-white dark:text-ink">
                {step}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold dark:text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </PolicySection>

      <PolicySection title="Hủy đơn trước khi nhận hàng">
        <p>
          Đơn đang ở trạng thái <b className="dark:text-white">"Chờ xác nhận"</b> thì bạn tự hủy được: vào{' '}
          <Link to="/tai-khoan/don-hang" className="link-underline text-accent">
            Tài khoản → Đơn hàng
          </Link>{' '}
          → bấm <b className="dark:text-white">Hủy đơn</b> và ghi lý do.
        </p>
        <p>
          Đơn đã được xác nhận hoặc đang chuẩn bị hàng thì gọi hotline {SHOP_CONTACT.hotline} — shop hủy giúp được khi
          hàng chưa rời kho. Đơn đã bàn giao cho đơn vị vận chuyển thì xử lý theo diện đổi trả ở trên.
        </p>
        <p>
          Đơn bị hủy sẽ được <b className="dark:text-white">hoàn lại tồn kho</b> và{' '}
          <b className="dark:text-white">hoàn lại lượt dùng voucher</b> — mã giảm giá bạn đã áp không bị mất.
        </p>
      </PolicySection>

      <PolicySection title="Hoàn tiền">
        <PolicyList
          items={[
            'Đơn COD chưa nhận hàng: chưa phát sinh thanh toán nên không có gì phải hoàn.',
            'Đơn đã chuyển khoản QR: shop hoàn tiền về đúng tài khoản đã chuyển, sau khi nhận và kiểm tra hàng trả về.',
            <>
              Trạng thái thanh toán của từng đơn hiện ngay trong{' '}
              <Link to="/tai-khoan/don-hang" className="link-underline text-accent">
                lịch sử đơn hàng
              </Link>
              .
            </>,
          ]}
        />
      </PolicySection>
    </PolicyLayout>
  )
}
