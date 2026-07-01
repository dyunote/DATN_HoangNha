import InfoPage from './InfoPage';

const ROWS = [
  ['S', '45 – 52', '78 – 84', '58 – 64'],
  ['M', '53 – 60', '85 – 90', '65 – 72'],
  ['L', '61 – 68', '91 – 96', '73 – 80'],
  ['XL', '69 – 76', '97 – 104', '81 – 88'],
];

export default function SizeGuidePage() {
  return (
    <InfoPage eyebrow="Hỗ trợ" title="Hướng dẫn chọn size">
      <p>Bảng size tham khảo (đơn vị: cân nặng kg / vòng ngực cm / vòng eo cm):</p>
      <div className="overflow-x-auto not-prose">
        <table className="w-full text-sm border border-beige">
          <thead className="bg-beige/60 text-ink text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="px-3 py-2 font-medium">Cân nặng</th>
              <th className="px-3 py-2 font-medium">Vòng ngực</th>
              <th className="px-3 py-2 font-medium">Vòng eo</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r[0]} className="border-t border-beige">
                {r.map((c, i) => (
                  <td key={i} className={`px-3 py-2 ${i === 0 ? 'font-medium text-ink' : ''}`}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs">Lưu ý: số đo mang tính tham khảo, có thể chênh lệch tùy phom từng sản phẩm.</p>
    </InfoPage>
  );
}
