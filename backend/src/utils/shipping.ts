// ============================================================
// Tinh phi van chuyen theo khoang cach (km) - mo phong Giao Hang Tiet Kiem
//   - Xac dinh tinh nhan tu dia chi / ten tinh
//   - Tinh quang duong tu kho (shop) toi tinh nhan bang Haversine
//   - Phan vung: noi tinh / noi mien / lien mien
//   - Phi = phi co ban theo vung + phu phi theo km vuot nguong
//   - Mien phi ship neu tong tien hang dat nguong (FREE_SHIP_THRESHOLD)
// ============================================================

import { findProvince, haversineKm, Province, Region } from './provinces';
import { AppError } from './response';

export type ShippingZone = 'noi_tinh' | 'noi_mien' | 'lien_mien';

export interface ShippingQuote {
  province: string;
  region: Region;
  distance_km: number;
  zone: ShippingZone;
  zone_label: string;
  base_fee: number;
  distance_fee: number;
  shipping_fee: number; // phi thuc thu (da tinh freeship)
  original_fee: number; // phi truoc khi freeship
  free_shipping: boolean;
  eta_days: string;
}

// ----- Cau hinh (co the override qua bien moi truong) -----
const SHOP_PROVINCE = process.env.SHOP_PROVINCE || 'Ha Noi';
const FREE_SHIP_THRESHOLD = Number(process.env.FREE_SHIP_THRESHOLD ?? 500000);

interface ZoneConfig {
  label: string;
  baseFee: number; // phi co ban
  freeKm: number; // so km dau khong tinh phu phi
  perKm: number; // phu phi moi km vuot nguong
  maxFee: number; // tran phi
  eta: string;
}

const ZONE_CONFIG: Record<ShippingZone, ZoneConfig> = {
  noi_tinh: { label: 'Noi tinh', baseFee: 16500, freeKm: 10, perKm: 1500, maxFee: 35000, eta: '1-2 ngay' },
  noi_mien: { label: 'Noi mien', baseFee: 22000, freeKm: 30, perKm: 400, maxFee: 45000, eta: '2-3 ngay' },
  lien_mien: { label: 'Lien mien', baseFee: 32000, freeKm: 100, perKm: 200, maxFee: 70000, eta: '3-5 ngay' },
};

const getShopProvince = (): Province => {
  const shop = findProvince(SHOP_PROVINCE);
  // Du phong: neu cau hinh sai, mac dinh Ha Noi
  return shop || findProvince('Ha Noi')!;
};

const resolveZone = (shop: Province, dest: Province): ShippingZone => {
  if (shop.name === dest.name) return 'noi_tinh';
  if (shop.region === dest.region) return 'noi_mien';
  return 'lien_mien';
};

const roundFee = (n: number) => Math.round(n / 1000) * 1000;

interface QuoteOptions {
  // Tong tien hang (sau giam gia) de xet freeship
  orderAmount?: number;
}

// Tinh phi ship toi mot tinh / dia chi
export const quoteShipping = (destinationInput: string, { orderAmount = 0 }: QuoteOptions = {}): ShippingQuote => {
  const dest = findProvince(destinationInput);
  if (!dest) {
    throw new AppError('Khong xac dinh duoc tinh/thanh nhan hang. Vui long chon dung tinh/thanh.', 400);
  }

  const shop = getShopProvince();
  const distanceRaw = haversineKm(shop, dest);
  const distance = Math.round(distanceRaw * 10) / 10;

  const zone = resolveZone(shop, dest);
  const cfg = ZONE_CONFIG[zone];

  const extraKm = Math.max(0, distance - cfg.freeKm);
  const distanceFee = roundFee(extraKm * cfg.perKm);
  const originalFee = Math.min(cfg.maxFee, cfg.baseFee + distanceFee);

  const freeShipping = FREE_SHIP_THRESHOLD > 0 && orderAmount >= FREE_SHIP_THRESHOLD;
  const shippingFee = freeShipping ? 0 : originalFee;

  return {
    province: dest.name,
    region: dest.region,
    distance_km: distance,
    zone,
    zone_label: cfg.label,
    base_fee: cfg.baseFee,
    distance_fee: distanceFee,
    shipping_fee: shippingFee,
    original_fee: originalFee,
    free_shipping: freeShipping,
    eta_days: cfg.eta,
  };
};

export const getFreeShipThreshold = () => FREE_SHIP_THRESHOLD;
export const getShopProvinceName = () => getShopProvince().name;
