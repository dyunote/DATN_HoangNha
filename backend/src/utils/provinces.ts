// ============================================================
// Danh sach 63 tinh/thanh Viet Nam: toa do (lat/lng) + vung mien
// Dung de uoc tinh khoang cach (km) tinh phi van chuyen.
// region: 'bac' | 'trung' | 'nam'
// ============================================================

export type Region = 'bac' | 'trung' | 'nam';

export interface Province {
  name: string;
  region: Region;
  lat: number;
  lng: number;
}

export const PROVINCES: Province[] = [
  // ----- MIEN BAC -----
  { name: 'Ha Noi', region: 'bac', lat: 21.0278, lng: 105.8342 },
  { name: 'Hai Phong', region: 'bac', lat: 20.8449, lng: 106.6881 },
  { name: 'Bac Giang', region: 'bac', lat: 21.2731, lng: 106.1946 },
  { name: 'Bac Kan', region: 'bac', lat: 22.1473, lng: 105.8348 },
  { name: 'Bac Ninh', region: 'bac', lat: 21.1861, lng: 106.0763 },
  { name: 'Cao Bang', region: 'bac', lat: 22.6657, lng: 106.2570 },
  { name: 'Dien Bien', region: 'bac', lat: 21.3860, lng: 103.0230 },
  { name: 'Ha Giang', region: 'bac', lat: 22.8233, lng: 104.9836 },
  { name: 'Ha Nam', region: 'bac', lat: 20.5835, lng: 105.9230 },
  { name: 'Hai Duong', region: 'bac', lat: 20.9373, lng: 106.3145 },
  { name: 'Hoa Binh', region: 'bac', lat: 20.8133, lng: 105.3383 },
  { name: 'Hung Yen', region: 'bac', lat: 20.6464, lng: 106.0511 },
  { name: 'Lai Chau', region: 'bac', lat: 22.3964, lng: 103.4708 },
  { name: 'Lang Son', region: 'bac', lat: 21.8537, lng: 106.7615 },
  { name: 'Lao Cai', region: 'bac', lat: 22.4809, lng: 103.9755 },
  { name: 'Nam Dinh', region: 'bac', lat: 20.4388, lng: 106.1621 },
  { name: 'Ninh Binh', region: 'bac', lat: 20.2506, lng: 105.9745 },
  { name: 'Phu Tho', region: 'bac', lat: 21.3989, lng: 105.1899 },
  { name: 'Quang Ninh', region: 'bac', lat: 21.0064, lng: 107.2925 },
  { name: 'Son La', region: 'bac', lat: 21.3270, lng: 103.9141 },
  { name: 'Thai Binh', region: 'bac', lat: 20.4463, lng: 106.3366 },
  { name: 'Thai Nguyen', region: 'bac', lat: 21.5928, lng: 105.8442 },
  { name: 'Tuyen Quang', region: 'bac', lat: 21.8230, lng: 105.2140 },
  { name: 'Vinh Phuc', region: 'bac', lat: 21.3089, lng: 105.6049 },
  { name: 'Yen Bai', region: 'bac', lat: 21.7168, lng: 104.8986 },

  // ----- MIEN TRUNG -----
  { name: 'Da Nang', region: 'trung', lat: 16.0544, lng: 108.2022 },
  { name: 'Thanh Hoa', region: 'trung', lat: 19.8067, lng: 105.7852 },
  { name: 'Nghe An', region: 'trung', lat: 18.6796, lng: 105.6813 },
  { name: 'Ha Tinh', region: 'trung', lat: 18.3559, lng: 105.8877 },
  { name: 'Quang Binh', region: 'trung', lat: 17.4689, lng: 106.6223 },
  { name: 'Quang Tri', region: 'trung', lat: 16.7943, lng: 107.0451 },
  { name: 'Thua Thien Hue', region: 'trung', lat: 16.4637, lng: 107.5909 },
  { name: 'Quang Nam', region: 'trung', lat: 15.5394, lng: 108.0191 },
  { name: 'Quang Ngai', region: 'trung', lat: 15.1214, lng: 108.8044 },
  { name: 'Binh Dinh', region: 'trung', lat: 13.7820, lng: 109.2190 },
  { name: 'Phu Yen', region: 'trung', lat: 13.0882, lng: 109.0929 },
  { name: 'Khanh Hoa', region: 'trung', lat: 12.2388, lng: 109.1967 },
  { name: 'Ninh Thuan', region: 'trung', lat: 11.5675, lng: 108.9888 },
  { name: 'Binh Thuan', region: 'trung', lat: 10.9804, lng: 108.2620 },
  { name: 'Kon Tum', region: 'trung', lat: 14.3497, lng: 108.0005 },
  { name: 'Gia Lai', region: 'trung', lat: 13.9833, lng: 108.0000 },
  { name: 'Dak Lak', region: 'trung', lat: 12.7100, lng: 108.2378 },
  { name: 'Dak Nong', region: 'trung', lat: 12.0044, lng: 107.6872 },
  { name: 'Lam Dong', region: 'trung', lat: 11.9404, lng: 108.4583 },

  // ----- MIEN NAM -----
  { name: 'Ho Chi Minh', region: 'nam', lat: 10.8231, lng: 106.6297 },
  { name: 'Can Tho', region: 'nam', lat: 10.0452, lng: 105.7469 },
  { name: 'Ba Ria Vung Tau', region: 'nam', lat: 10.5417, lng: 107.2429 },
  { name: 'Binh Duong', region: 'nam', lat: 11.3254, lng: 106.4770 },
  { name: 'Binh Phuoc', region: 'nam', lat: 11.7512, lng: 106.7235 },
  { name: 'Dong Nai', region: 'nam', lat: 10.9574, lng: 106.8426 },
  { name: 'Tay Ninh', region: 'nam', lat: 11.3100, lng: 106.0989 },
  { name: 'An Giang', region: 'nam', lat: 10.5216, lng: 105.1259 },
  { name: 'Bac Lieu', region: 'nam', lat: 9.2940, lng: 105.7216 },
  { name: 'Ben Tre', region: 'nam', lat: 10.2415, lng: 106.3759 },
  { name: 'Ca Mau', region: 'nam', lat: 9.1769, lng: 105.1524 },
  { name: 'Dong Thap', region: 'nam', lat: 10.4938, lng: 105.6882 },
  { name: 'Hau Giang', region: 'nam', lat: 9.7579, lng: 105.6413 },
  { name: 'Kien Giang', region: 'nam', lat: 10.0125, lng: 105.0808 },
  { name: 'Long An', region: 'nam', lat: 10.6957, lng: 106.2431 },
  { name: 'Soc Trang', region: 'nam', lat: 9.6037, lng: 105.9800 },
  { name: 'Tien Giang', region: 'nam', lat: 10.4493, lng: 106.3420 },
  { name: 'Tra Vinh', region: 'nam', lat: 9.9347, lng: 106.3453 },
  { name: 'Vinh Long', region: 'nam', lat: 10.2538, lng: 105.9722 },
];

// Bo dau tieng Viet + chuan hoa de so khop ten tinh linh hoat
export const normalize = (s: string): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\b(tinh|thanh pho|tp\.?|t\.?)\b/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Mot so ten goi khac thuong gap -> ten chuan trong PROVINCES
const ALIASES: Record<string, string> = {
  'tphcm': 'ho chi minh',
  'hcm': 'ho chi minh',
  'sai gon': 'ho chi minh',
  'saigon': 'ho chi minh',
  'tp hcm': 'ho chi minh',
  'hue': 'thua thien hue',
  'br vt': 'ba ria vung tau',
  'vung tau': 'ba ria vung tau',
};

// Tim tinh theo ten (chap nhan input lung tung, vd "TP. Da Nang", "tỉnh Nghệ An")
export const findProvince = (input?: string | null): Province | null => {
  if (!input) return null;
  const key = normalize(input);
  if (!key) return null;

  const aliased = ALIASES[key] || key;

  // Khop chinh xac truoc
  let found = PROVINCES.find((p) => normalize(p.name) === aliased);
  if (found) return found;

  // Khop khi ten tinh nam trong chuoi dia chi (chon ten dai nhat trung)
  const hasToken = (hay: string, needle: string) => ` ${hay} `.includes(` ${needle} `);
  const candidates = PROVINCES.filter((p) => hasToken(aliased, normalize(p.name)));
  if (candidates.length) {
    return candidates.sort((a, b) => normalize(b.name).length - normalize(a.name).length)[0];
  }

  // Khop theo ten viet tat (vd "TP.HCM", "Sai Gon") xuat hien trong dia chi
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (key === alias || hasToken(aliased, alias)) {
      const found2 = PROVINCES.find((p) => normalize(p.name) === canonical);
      if (found2) return found2;
    }
  }
  return null;
};

// Khoang cach Haversine giua 2 toa do (km)
export const haversineKm = (a: Province, b: Province): number => {
  const R = 6371; // ban kinh trai dat (km)
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
