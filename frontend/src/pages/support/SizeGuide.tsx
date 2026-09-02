import { Link } from 'react-router-dom'
import PolicyLayout, { PolicyList, PolicySection } from '@/components/support/PolicyLayout'
import { usePageTitle } from '@/hooks/usePageTitle'

/**
 * Bảng size THAM KHẢO theo chuẩn cỡ Việt Nam.
 *
 * LƯU Ý CHO NGƯỜI QUẢN TRỊ: số đo ở đây không lấy từ database — hệ thống chỉ
 * lưu tên size ("S", "M"...) chứ không lưu số đo. Shop phải đối chiếu với rập
 * thật của mình rồi chỉnh lại bảng này.
 */
const SIZE_ROWS = [
  { size: 'XS', height: '1m45 – 1m52', weight: '38 – 43kg', bust: '76 – 80', waist: '58 – 62', hip: '84 – 88' },
  { size: 'S', height: '1m50 – 1m57', weight: '43 – 48kg', bust: '80 – 84', waist: '62 – 66', hip: '88 – 92' },
  { size: 'M', height: '1m55 – 1m62', weight: '48 – 55kg', bust: '84 – 88', waist: '66 – 70', hip: '92 – 96' },
  { size: 'L', height: '1m60 – 1m67', weight: '55 – 62kg', bust: '88 – 93', waist: '70 – 75', hip: '96 – 101' },
  { size: 'XL', height: '1m65 – 1m72', weight: '62 – 70kg', bust: '93 – 98', waist: '75 – 81', hip: '101 – 106' },
  { size: 'XXL', height: '1m68 – 1m75', weight: '70 – 78kg', bust: '98 – 104', waist: '81 – 87', hip: '106 – 112' },
]

const HOW_TO_MEASURE = [
  <>
    <b className="dark:text-white">Vòng ngực:</b> đo vòng quanh phần đầy nhất của ngực, thước song song với mặt sàn,
    không siết chặt.
  </>,
  <>
    <b className="dark:text-white">Vòng eo:</b> đo tại chỗ nhỏ nhất của eo, thường trên rốn khoảng 2cm.
  </>,
  <>
    <b className="dark:text-white">Vòng mông:</b> đo vòng quanh phần nở nhất của hông, hai chân khép lại.
  </>,
  <>
    <b className="dark:text-white">Nên đo khi mặc đồ mỏng</b>, đứng thẳng tự nhiên, không hóp bụng — số đo sát thực tế
    thì chọn size mới chuẩn.
  </>,
]

export default function SizeGuide() {
  usePageTitle('Hướng dẫn chọn size')
  return (
    <PolicyLayout
      eyebrow="Hỗ trợ"
      title="Hướng dẫn chọn size"
      lead="Ba số đo cơ bản là đủ để chọn đúng size ngay lần đầu. Nếu vẫn phân vân giữa hai size, phần cuối trang có gợi ý cho từng kiểu dáng."
    >
      <PolicySection title="Bảng size tham khảo">
        <p>Đơn vị: cm. Số đo cơ thể, không phải số đo thành phẩm của áo/quần.</p>
        {/* Bảng luôn cuộn ngang được trên điện thoại thay vì vỡ layout */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-white/10">
                {['Size', 'Chiều cao', 'Cân nặng', 'Ngực', 'Eo', 'Mông'].map((h) => (
                  <th key={h} className="label-field py-3 pr-4 font-semibold text-slate-500 dark:text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZE_ROWS.map((r) => (
                <tr key={r.size} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                  <td className="py-3 pr-4 font-semibold dark:text-white">{r.size}</td>
                  <td className="py-3 pr-4">{r.height}</td>
                  <td className="py-3 pr-4">{r.weight}</td>
                  <td className="py-3 pr-4">{r.bust}</td>
                  <td className="py-3 pr-4">{r.waist}</td>
                  <td className="py-3 pr-4">{r.hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          Số đo mang tính tham khảo, sai số ±2cm tùy kiểu dáng và chất liệu. Với đồ dáng rộng (oversized, blazer) bảng
          này thường rộng hơn một size.
        </p>
      </PolicySection>

      <PolicySection title="Cách đo">
        <PolicyList items={HOW_TO_MEASURE} />
      </PolicySection>

      <PolicySection title="Phân vân giữa hai size?">
        <PolicyList
          items={[
            'Áo khoác, blazer, cardigan — chọn size lớn hơn để mặc chồng được áo bên trong.',
            'Áo thun, sơ mi ôm dáng — chọn size nhỏ hơn nếu bạn thích form vừa vặn, size lớn hơn nếu thích thoải mái.',
            'Quần — ưu tiên số đo vòng eo; phần ống có thể lên lai được, vòng eo thì không.',
            'Chất liệu dệt kim, len có độ co giãn — chọn đúng số đo của bạn, không cần lên size.',
          ]}
        />
      </PolicySection>

      <PolicySection title="Size bạn cần đang hết hàng?">
        <p>
          Tồn kho được tính riêng cho từng tổ hợp <b className="dark:text-white">màu × size</b>, nên một sản phẩm có thể
          còn size M màu đen nhưng hết size M màu be. Ở trang sản phẩm, những size đã hết của màu đang chọn sẽ bị làm mờ
          và không bấm được.
        </p>
        <p>
          Chọn nhầm size vẫn đổi được — xem <Link to="/chinh-sach-doi-tra" className="link-underline text-accent">chính
          sách đổi trả</Link> (7 ngày kể từ khi nhận hàng, còn nguyên tem mác).
        </p>
      </PolicySection>
    </PolicyLayout>
  )
}
