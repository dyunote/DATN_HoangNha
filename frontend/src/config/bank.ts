// ============================================================
// Thông tin ngân hàng nhận chuyển khoản (dùng cho mã QR VietQR)
// >>> SỬA LẠI 3 dòng dưới thành tài khoản thật của bạn <<<
// Danh sách mã ngân hàng: vietcombank, techcombank, mbbank,
// tpbank, acb, bidv, vietinbank, sacombank, vpbank, agribank...
// ============================================================
export const BANK_INFO = {
  bankCode: 'vietcombank',     // mã ngân hàng (viết thường, không dấu)
  accountNo: '1234567890',     // số tài khoản
  accountName: 'HOANG NHA SHOP', // tên chủ tài khoản (IN HOA, không dấu)
};

/**
 * Tạo link ảnh mã QR VietQR đã điền sẵn số tiền và nội dung.
 * @param amount  số tiền cần thanh toán
 * @param addInfo nội dung chuyển khoản (vd: "DH12")
 */
export const buildVietQrUrl = (amount: number, addInfo: string): string => {
  const base = `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNo}-compact2.png`;
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo,
    accountName: BANK_INFO.accountName,
  });
  return `${base}?${params.toString()}`;
};
