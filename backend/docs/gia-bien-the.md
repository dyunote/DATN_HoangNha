# Giá theo biến thể (size × màu)

Cho phép mỗi tổ hợp size × màu có giá riêng: size XXL đắt hơn size S, màu limited
có phụ thu. Sản phẩm thường vẫn để trống → dùng chung một giá.

---

## Mô hình dữ liệu

```prisma
model Variant {
  price    Int?   // NULL = dùng giá của Product
  oldPrice Int?   // giá gạch ngang riêng
}
```

**Vì sao nullable thay vì bắt buộc.** Đa số sản phẩm mọi biến thể cùng giá. Nếu bắt
buộc nhập giá cho từng tổ hợp (3 màu × 5 size = 15 dòng), admin phải gõ 15 lần cùng
một con số — vừa tốn công vừa dễ lệch khi đổi giá. Để `NULL` nghĩa là "theo giá sản
phẩm", đổi giá một chỗ là xong.

Công thức giá cuối cùng ở mọi nơi:

```ts
const giaThucTe = variant.price ?? product.price
```

---

## Backend

**`toDto()` trong `products.ts`** trả thêm:

| Trường | Ý nghĩa |
|---|---|
| `variants[]` | Từng biến thể kèm `price` đã gộp sẵn (không còn null) |
| `minPrice` / `maxPrice` | Khoảng giá của sản phẩm |
| `hasPriceRange` | `true` khi các biến thể khác giá → UI hiện "từ ...đ" |
| `price` | = `minPrice`, dùng cho danh sách và sắp xếp |

**`orders.ts`** lấy `variant.price ?? p.price` khi tính `subtotal`. Đây là điểm quan
trọng nhất: giá luôn đọc từ DB theo biến thể khách chọn, không bao giờ tin số tiền
client gửi lên. Client chỉ gửi `productId + size + color + quantity`.

**Admin API mới:**

```
GET    /api/admin/products/:id/variants
POST   /api/admin/products/:id/variants
PUT    /api/admin/variants/:id       ← đổi giá riêng, nhập thêm kho
DELETE /api/admin/variants/:id
```

Sửa `stock` qua API này sẽ tự ghi một dòng `StockMovement` với `reason: 'adjust'`
để đối soát sau.

> **Bẫy cần tránh:** form gửi chuỗi rỗng khi admin xóa ô giá. Code quy đổi `''` thành
> `null` (theo giá sản phẩm), **không** thành `0` — vì `0` nghĩa là bán miễn phí.

---

## Frontend

Toàn bộ logic tra giá nằm ở `src/lib/variant.ts`, dùng chung cho mọi component:

```ts
getVariantPrice(product, size, color)     // giá hiển thị
getVariantOldPrice(product, size, color)  // giá gạch ngang
getVariantStock(product, size, color)     // tồn kho riêng tổ hợp
sizesInStock(product, color)              // size nào còn hàng theo màu
```

Các hàm này đều có fallback về `product.price` khi sản phẩm chưa có mảng `variants`
(dữ liệu mock cũ), nên web không vỡ khi backend tắt.

**Thay đổi ở UI:**

- **ProductDetail** — giá đổi ngay khi bấm size/màu, có animation nhẹ để khách nhận
  ra. Nút size hiện `+50k` cho biến thể đắt hơn, size hết hàng bị gạch ngang và
  không bấm được. Tồn kho hiển thị theo đúng tổ hợp thay vì tổng của cả sản phẩm.
- **ProductCard** — hiện "từ 220.000đ" khi `hasPriceRange`.
- **QuickViewModal** — tương tự ProductDetail, gọn hơn.
- **CartItem** — thêm trường `unitPrice`, chốt giá tại thời điểm thêm vào giỏ. Giỏ
  hàng và tổng tiền dùng `unitPrice`, không dùng `product.price` (vốn chỉ là giá
  thấp nhất).

---

## Dữ liệu mẫu

`seed.ts` đặt giá riêng cho mỗi sản phẩm thứ 4 (`i % 4 === 0`), theo quy tắc:

```ts
const SIZE_SURCHARGE = { XS: 0, S: 0, M: 0, L: 20000, XL: 50000, XXL: 80000 }
// + 30.000đ cho màu đầu tiên trong bộ (màu limited)
```

Các sản phẩm còn lại để `price = null` — dùng để kiểm tra rằng nhánh fallback vẫn
chạy đúng.

---

## Áp dụng

```bash
cd D:\hoangnha\backend
npx prisma generate    # sinh type mới cho Variant.price
npx prisma db push     # thêm 2 cột vào bảng Variant
npm run db:seed        # nạp lại dữ liệu có giá biến thể
```

Kiểm tra: mở một sản phẩm bất kỳ trong nhóm `i % 4 === 0` (sản phẩm thứ 1, 5, 9...),
bấm đổi size từ M sang XL — giá phải tăng 50.000đ và tổng tiền trong giỏ phải khớp
với giá đã chọn chứ không phải giá thấp nhất.
