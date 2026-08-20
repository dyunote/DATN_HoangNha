import { useState } from 'react'
import { Ruler } from 'lucide-react'
import { Section, CheckList, Note, DataTable } from '@/components/support/Prose'

// Bảng size tách riêng theo nhóm sản phẩm — người dùng bấm tab để đổi bảng,
// tránh đổ 4 bảng dài liên tiếp làm trang quá rối.
const TABS = [
  {
    key: 'ao-nu',
    label: 'Áo nữ',
    head: ['Size', 'Ngực (cm)', 'Eo (cm)', 'Dài áo (cm)', 'Cân nặng gợi ý'],
    rows: [
      ['S', '82 – 86', '62 – 66', '58', '43 – 48 kg'],
      ['M', '86 – 90', '66 – 70', '60', '48 – 53 kg'],
      ['L', '90 – 95', '70 – 75', '62', '53 – 58 kg'],
      ['XL', '95 – 100', '75 – 80', '64', '58 – 64 kg'],
    ],
  },
  {
    key: 'quan-nu',
    label: 'Quần / Chân váy nữ',
    head: ['Size', 'Eo (cm)', 'Mông (cm)', 'Dài quần (cm)', 'Cân nặng gợi ý'],
    rows: [
      ['S (26)', '62 – 66', '88 – 91', '96', '43 – 48 kg'],
      ['M (28)', '66 – 70', '91 – 94', '98', '48 – 53 kg'],
      ['L (30)', '70 – 75', '94 – 98', '100', '53 – 58 kg'],
      ['XL (32)', '75 – 80', '98 – 103', '102', '58 – 64 kg'],
    ],
  },
  {
    key: 'ao-nam',
    label: 'Áo nam',
    head: ['Size', 'Ngực (cm)', 'Vai (cm)', 'Dài áo (cm)', 'Cân nặng gợi ý'],
    rows: [
      ['M', '96 – 100', '44', '69', '55 – 62 kg'],
      ['L', '100 – 105', '45.5', '71', '62 – 70 kg'],
      ['XL', '105 – 110', '47', '73', '70 – 78 kg'],
      ['XXL', '110 – 116', '48.5', '75', '78 – 86 kg'],
    ],
  },
  {
    key: 'quan-nam',
    label: 'Quần nam',
    head: ['Size', 'Eo (cm)', 'Mông (cm)', 'Dài quần (cm)', 'Cân nặng gợi ý'],
    rows: [
      ['29', '73 – 76', '92 – 95', '100', '55 – 60 kg'],
      ['30', '76 – 79', '95 – 98', '101', '60 – 66 kg'],
      ['31', '79 – 83', '98 – 101', '102', '66 – 72 kg'],
      ['32', '83 – 87', '101 – 105', '103', '72 – 80 kg'],
    ],
  },
]

export default function SizeGuide() {
  const [active, setActive] = useState(0)
  const tab = TABS[active]

  return (
    <>
      <Section index={1} title="Cách tự đo số đo tại nhà">
        <p>
          Chỉ cần một thước dây mềm. Đo trên nền quần áo mỏng, đứng thẳng tự nhiên, giữ thước sát người nhưng không siết
          chặt. Nếu số đo của bạn nằm giữa hai size, hãy chọn size lớn hơn để dáng áo thoải mái hơn.
        </p>
        <CheckList
          items={[
            <>
              <strong className="text-ink dark:text-white">Vòng ngực:</strong> đo vòng quanh phần đầy nhất của ngực, thước
              song song mặt sàn.
            </>,
            <>
              <strong className="text-ink dark:text-white">Vòng eo:</strong> đo tại phần nhỏ nhất của eo, thường trên rốn
              khoảng 2 cm.
            </>,
            <>
              <strong className="text-ink dark:text-white">Vòng mông:</strong> đo quanh phần nở nhất của hông, hai chân
              khép lại.
            </>,
            <>
              <strong className="text-ink dark:text-white">Rộng vai:</strong> đo từ điểm nối vai trái sang vai phải, ngang
              qua lưng.
            </>,
          ]}
        />
        <Note>
          <span className="inline-flex items-center gap-2 font-semibold">
            <Ruler size={15} /> Mẹo nhỏ
          </span>
          <p className="mt-1.5">
            Nhờ người khác đo giúp sẽ chính xác hơn tự đo, đặc biệt là vòng ngực và rộng vai. Sai số ±1 cm là bình thường
            và không ảnh hưởng tới việc chọn size.
          </p>
        </Note>
      </Section>

      <Section index={2} title="Bảng size Hoàng Nha">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              onClick={() => setActive(i)}
              className={`cursor-pointer rounded-btn px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
                i === active
                  ? 'bg-ink text-white dark:bg-white dark:text-ink'
                  : 'border border-slate-200 text-slate-500 hover:border-ink hover:text-ink dark:border-white/15 dark:text-slate-400 dark:hover:border-white dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <DataTable head={tab.head} rows={tab.rows} />
        <p className="text-xs text-slate-400">
          Số đo tính theo cơ thể (không phải số đo sản phẩm). Một vài thiết kế dáng oversized hoặc ôm body sẽ có ghi chú
          riêng ngay tại trang sản phẩm.
        </p>
      </Section>

      <Section index={3} title="Chọn size theo phom dáng">
        <DataTable
          head={['Phom dáng', 'Cảm giác mặc', 'Gợi ý chọn size']}
          rows={[
            ['Slim fit', 'Ôm sát, tôn dáng', 'Chọn đúng size theo bảng, hoặc lên 1 size nếu thích thoải mái'],
            ['Regular fit', 'Vừa vặn tiêu chuẩn', 'Chọn đúng size theo bảng'],
            ['Relaxed / Oversized', 'Rộng rãi, buông tự nhiên', 'Chọn đúng size; xuống 1 size nếu muốn bớt rộng'],
          ]}
        />
      </Section>

      <Section index={4} title="Vẫn phân vân?">
        <p>
          Nhắn số đo (cao – nặng – 3 vòng) qua khung chat ở góc phải màn hình hoặc gọi hotline, đội tư vấn sẽ gợi ý size
          trong vài phút. Nếu nhận hàng thấy chưa vừa, bạn được{' '}
          <strong className="text-ink dark:text-white">đổi size miễn phí lần đầu</strong> trong vòng 7 ngày — xem chi
          tiết ở trang Chính sách đổi trả.
        </p>
      </Section>
    </>
  )
}
