import { Banknote, QrCode, Wallet, CreditCard, ShieldCheck } from 'lucide-react'
import { SiVisa, SiMastercard, SiJcb } from 'react-icons/si'
import { Section, CheckList, Note, DataTable } from '@/components/support/Prose'
import { useSettings } from '@/context/SettingsContext'
import { formatVND } from '@/data'

const METHODS = [
  {
    Icon: Banknote,
    name: 'Thanh toán khi nhận hàng (COD)',
    desc: 'Nhận hàng, kiểm tra bên ngoài kiện hàng rồi trả tiền mặt cho shipper. Áp dụng toàn quốc.',
    note: 'Đơn trên 5.000.000đ cần đặt cọc 20% trước khi giao.',
  },
  {
    Icon: QrCode,
    name: 'Chuyển khoản QR (SePay)',
    desc: 'Quét mã QR hiện ngay ở bước thanh toán bằng app ngân hàng bất kỳ. Hệ thống tự xác nhận trong vài giây.',
    note: 'Nhanh nhất, đơn được đóng gói ngay khi tiền về.',
  },
  {
    Icon: Wallet,
    name: 'Ví điện tử',
    desc: 'MoMo, ZaloPay, VNPAY — thanh toán bằng số dư ví hoặc thẻ đã liên kết sẵn.',
    note: 'Thường có mã giảm giá riêng từ phía ví.',
  },
  {
    Icon: CreditCard,
    name: 'Thẻ quốc tế',
    desc: 'Visa, Mastercard, JCB. Giao dịch xử lý trên cổng thanh toán, website không lưu số thẻ.',
    note: 'Hỗ trợ xác thực 3-D Secure của ngân hàng phát hành.',
  },
]

export default function PaymentMethods() {
  const { settings } = useSettings()

  return (
    <>
      <Section index={1} title="Các hình thức thanh toán">
        <div className="grid gap-4 sm:grid-cols-2">
          {METHODS.map(({ Icon, name, desc, note }) => (
            <div
              key={name}
              className="rounded-card border border-slate-200 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-accent/10 dark:border-white/10"
            >
              <Icon size={22} className="text-accent-dark" />
              <p className="mt-3 font-semibold text-ink dark:text-white">{name}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
              <p className="mt-3 text-xs text-accent-dark">{note}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-5 pt-2 text-3xl text-slate-400">
          <SiVisa />
          <SiMastercard />
          <SiJcb />
          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wider text-slate-500 dark:bg-white/10 dark:text-slate-300">
            VNPAY
          </span>
          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wider text-slate-500 dark:bg-white/10 dark:text-slate-300">
            MOMO
          </span>
        </div>
      </Section>

      <Section index={2} title="Phí vận chuyển">
        {/* Số liệu đọc từ cấu hình cửa hàng — admin đổi trong trang Cài đặt là trang này đổi theo */}
        <DataTable
          head={['Gói vận chuyển', 'Thời gian dự kiến', 'Phí']}
          rows={[
            ['Tiêu chuẩn', '2 – 5 ngày làm việc', formatVND(settings.ship_fee_standard)],
            ['Nhanh', '1 – 2 ngày làm việc', formatVND(settings.ship_fee_express)],
          ]}
        />
        <Note>
          <strong>Miễn phí vận chuyển</strong> gói tiêu chuẩn cho mọi đơn hàng từ{' '}
          {formatVND(settings.freeship_threshold)} trở lên.
        </Note>
      </Section>

      <Section index={3} title="Các bước thanh toán">
        <ol className="space-y-2.5">
          {[
            'Thêm sản phẩm vào giỏ và bấm "Thanh toán".',
            'Điền địa chỉ nhận hàng, chọn gói vận chuyển.',
            'Nhập mã voucher nếu có — hệ thống tự trừ vào tổng tiền.',
            'Chọn hình thức thanh toán và hoàn tất.',
            'Nhận email/SMS xác nhận kèm mã đơn để tra cứu trong mục Tài khoản → Đơn hàng.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent-dark">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section index={4} title="An toàn giao dịch">
        <CheckList
          items={[
            'Website mã hóa HTTPS trên toàn bộ trang, kể cả bước nhập thông tin thanh toán.',
            'Hoàng Nha không lưu và không bao giờ hỏi số thẻ, mã CVV hay mã OTP của bạn.',
            'Mọi giao dịch thẻ đi qua cổng thanh toán đạt chuẩn PCI-DSS.',
            'Nếu nhận được cuộc gọi lạ xin OTP nhân danh Hoàng Nha, hãy từ chối và báo ngay cho hotline.',
          ]}
        />
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} className="text-accent-dark" /> Hotline chính thức: {settings.hotline}
        </p>
      </Section>

      <Section index={5} title="Hóa đơn VAT">
        <p>
          Cần hóa đơn đỏ, bạn ghi thông tin công ty (tên, mã số thuế, địa chỉ) vào ô "Ghi chú đơn hàng" khi thanh toán,
          hoặc gửi email tới {settings.contact_email} trong vòng 24h sau khi đặt. Hóa đơn điện tử được gửi qua email
          trong 3 – 5 ngày làm việc.
        </p>
      </Section>
    </>
  )
}
