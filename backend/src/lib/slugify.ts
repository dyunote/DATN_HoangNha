/**
 * Đổi chữ tiếng Việt có dấu thành slug dùng được trong URL.
 *   'Áo khoác'   → 'ao-khoac'
 *   'Đầm dạ hội' → 'dam-da-hoi'
 *
 * Cách hoạt động:
 *  1. `normalize('NFD')` tách chữ có dấu thành "chữ gốc + dấu rời"
 *     ('á' → 'a' + '´'), rồi xoá dải dấu thanh U+0300–U+036F.
 *  2. 'đ' KHÔNG phải chữ có dấu ghép nên NFD không tách được — phải đổi tay,
 *     không đổi thì nó bị coi là ký tự lạ và biến thành dấu gạch.
 *  3. Mọi ký tự còn lại ngoài a–z, 0–9 → gạch ngang, gộp gạch liền nhau,
 *     cắt gạch ở hai đầu.
 *
 * Dùng chung cho slug danh mục và slug sản phẩm — đừng chép lại logic này.
 */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
