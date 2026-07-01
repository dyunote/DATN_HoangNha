// ============================================================
// Ho tro tich hop SePay (https://sepay.vn)
//   - Sinh ma noi dung chuyen khoan tu ma don hang
//   - Tao link QR VietQR dong (qr.sepay.vn)
//   - Tach ma don hang tu noi dung chuyen khoan webhook gui ve
// ============================================================

// Tien to ma thanh toan, vi du: HN12 = don hang #12
export const PAYMENT_PREFIX = process.env.SEPAY_PREFIX || 'HN';

export interface SepayConfig {
  accountNumber: string;
  bank: string;
  accountName: string;
  apiKey: string;
}

export const getSepayConfig = (): SepayConfig => ({
  accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '',
  bank: process.env.SEPAY_BANK || '',
  accountName: process.env.SEPAY_ACCOUNT_NAME || '',
  apiKey: process.env.SEPAY_API_KEY || '',
});

// Ma noi dung chuyen khoan cho mot don hang
export const buildTransferCode = (orderId: number): string => `${PAYMENT_PREFIX}${orderId}`;

// Tach orderId tu noi dung chuyen khoan (vd "HN12 thanh toan don hang" -> 12)
export const parseOrderIdFromContent = (content: string): number | null => {
  if (!content) return null;
  const stripped = content.replace(/\s+/g, '');
  const match = stripped.match(new RegExp(`${PAYMENT_PREFIX}0*([0-9]+)`, 'i'));
  return match ? Number(match[1]) : null;
};

// Tao link anh QR VietQR dong qua SePay
export const buildQrUrl = (amount: number, transferCode: string): string | null => {
  const { accountNumber, bank } = getSepayConfig();
  if (!accountNumber || !bank) return null;
  const params = new URLSearchParams({
    acc: accountNumber,
    bank,
    amount: String(Math.round(amount)),
    des: transferCode,
    template: 'compact',
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
};

// Xac thuc header webhook: "Authorization: Apikey <key>"
export const verifyApiKey = (authHeader?: string): boolean => {
  const { apiKey } = getSepayConfig();
  if (!apiKey) return false; // chua cau hinh -> tu choi de an toan
  if (!authHeader) return false;
  const expected = `Apikey ${apiKey}`;
  return authHeader.trim() === expected;
};

// Thong tin thanh toan tra ve cho client de hien thi QR
export interface PaymentIntent {
  method: string;
  amount: number;
  transfer_code: string;
  qr_url: string | null;
  bank: string;
  account_number: string;
  account_name: string;
}

export const buildPaymentIntent = (orderId: number, amount: number): PaymentIntent => {
  const cfg = getSepayConfig();
  const transferCode = buildTransferCode(orderId);
  return {
    method: 'bank_transfer',
    amount: Math.round(amount),
    transfer_code: transferCode,
    qr_url: buildQrUrl(amount, transferCode),
    bank: cfg.bank,
    account_number: cfg.accountNumber,
    account_name: cfg.accountName,
  };
};
