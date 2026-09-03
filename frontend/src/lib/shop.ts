/**
 * Thông tin liên hệ của shop — MỘT nguồn duy nhất.
 * Footer, các trang chính sách và trợ lý chat phải nói cùng một số hotline;
 * trước đây mỗi chỗ chép một bản, đổi số là phải nhớ sửa đủ mọi nơi.
 * Bản của backend nằm ở backend/src/lib/supportBot.ts (CONTACT).
 */
export const SHOP_CONTACT = {
  hotline: '1900 8686',
  hours: '8h–21h hằng ngày',
  email: 'hello@hoangnha.vn',
  address: '86 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh',
} as const
