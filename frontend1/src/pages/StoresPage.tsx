import InfoPage from './InfoPage';

const STORES = [
  { name: 'Hoàng Nha Hà Nội', addr: '12 Nguyễn Trãi, Thanh Xuân, Hà Nội', phone: '0979 026 169' },
  { name: 'Hoàng Nha TP.HCM', addr: '45 Lê Lợi, Quận 1, TP. Hồ Chí Minh', phone: '0979 026 170' },
  { name: 'Hoàng Nha Đà Nẵng', addr: '78 Trần Phú, Hải Châu, Đà Nẵng', phone: '0979 026 171' },
];

export default function StoresPage() {
  return (
    <InfoPage eyebrow="Cửa hàng" title="Hệ thống cửa hàng">
      <p>Ghé thăm các cửa hàng Hoàng Nha để trải nghiệm sản phẩm trực tiếp:</p>
      <ul className="space-y-3 not-prose">
        {STORES.map((s) => (
          <li key={s.name} className="border-b border-beige pb-3 last:border-0">
            <p className="text-ink font-medium">{s.name}</p>
            <p>{s.addr}</p>
            <p className="text-accent">{s.phone}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs">Giờ mở cửa: 9:00 – 21:00 tất cả các ngày trong tuần.</p>
    </InfoPage>
  );
}
