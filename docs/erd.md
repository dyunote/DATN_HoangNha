# Hoàng Nha Fashion — Thiết kế Cơ sở dữ liệu (ERD — 13 bảng)

Bản đã chỉnh theo góp ý ERD:

1. **Mỗi đầu dây 2 ký hiệu (min, max)** — chân quạ + vòng tròn/gạch, xem quy ước ở mục 3.10.
2. `products` – `product_images` nối qua FK `product_id`.
3. Đã có `variants` thì `cart_items` / `order_items` / `reviews` **chỉ nối vào variants**
   (bỏ FK `product_id` thừa — sản phẩm suy ra qua `variants.product_id`).
4. **Gộp `payments` vào `orders`** — quan hệ 1-1 (một đơn đúng 1 lần thanh toán,
   1 lần thanh toán thuộc đúng 1 đơn) nên tách bảng không thêm thông tin gì.
5. **Xóa `sepay_webhook_logs`** — chống trùng webhook bằng chính trạng thái
   `payment_status` của đơn (update có điều kiện), không cần bảng log.
6. Tên bảng thống nhất **số nhiều + snake_case**: `users`, `orders`, `vouchers`...

## 1. Danh sách 13 bảng

| # | Bảng | Vai trò |
|---|---|---|
| 1 | **users** | Tài khoản khách + admin |
| 2 | **addresses** | Sổ địa chỉ giao hàng |
| 3 | **categories** | Danh mục sản phẩm |
| 4 | **products** | Sản phẩm (cờ `is_new/is_best_seller/flash_sale` thay cho bảng bộ sưu tập/chiến dịch) |
| 5 | **product_images** | Ảnh gallery của sản phẩm |
| 6 | **variants** | Biến thể màu × size × tồn kho (+ giá riêng) — "đơn vị bán" duy nhất |
| 7 | **cart_items** | Giỏ hàng (đồng bộ theo tài khoản) — chỉ trỏ vào `variants` |
| 8 | **orders** | Đơn hàng (đã gộp vận đơn + **thanh toán**) |
| 9 | **order_items** | Dòng đơn hàng — snapshot giá lúc mua, chỉ trỏ vào `variants` |
| 10 | **vouchers** | Mã giảm giá |
| 11 | **reviews** | Đánh giá (+ phản hồi shop) — chỉ trỏ vào `variants` |
| 12 | **notifications** | Thông báo cho khách |
| 13 | **banners** | Banner hero trang chủ (CMS) |

> **Wishlist** (yêu thích) và **"Đã xem gần đây"** lưu `localStorage` phía trình duyệt, không cần bảng.

## 2. Sơ đồ ERD (Mermaid)

```mermaid
erDiagram
    users ||--o{ addresses : "có"
    users ||--o{ orders : "đặt"
    users ||--o{ reviews : "viết"
    users ||--o{ cart_items : "có"
    users ||--o{ notifications : "nhận"

    categories ||--o{ products : "chứa"
    products ||--o{ product_images : "có"
    products ||--o{ variants : "có"

    variants ||--o{ cart_items : "được chọn"
    variants ||--o{ order_items : "được bán"
    variants ||--o{ reviews : "được đánh giá"

    orders ||--|{ order_items : "gồm"
    orders |o--o{ notifications : "sinh ra"
    vouchers |o--o{ orders : "áp dụng"
    vouchers |o--o{ notifications : "quảng bá"

    users {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar phone
        varchar avatar
        varchar gender
        varchar birthday
        varchar role "CUSTOMER | ADMIN"
        datetime created_at
    }

    addresses {
        int id PK
        int user_id FK1
        varchar label
        varchar name
        varchar phone
        varchar street
        varchar ward
        varchar city
        boolean is_default
    }

    categories {
        int id PK
        varchar name
        varchar slug UK
        text image
    }

    products {
        int id PK
        int category_id FK1
        varchar name
        varchar slug UK
        text description
        int price
        int old_price
        varchar brand
        varchar material
        float rating "denormalized"
        int review_count
        int sold
        boolean is_new
        boolean is_best_seller
        boolean is_trending
        boolean flash_sale
        datetime created_at
    }

    product_images {
        int id PK
        int product_id FK1
        text url
        int sort_order
    }

    variants {
        int id PK
        int product_id FK1
        varchar color
        varchar color_hex
        varchar size
        int stock
        int price "null = dùng giá sản phẩm"
        int old_price
    }

    cart_items {
        int id PK
        int user_id FK1
        int variant_id FK2 "UNIQUE(user_id, variant_id)"
        int quantity
    }

    orders {
        varchar id PK "HN-yymmdd-xxxx"
        int user_id FK1
        int voucher_id FK2 "null được"
        varchar status "pending|confirmed|shipping|delivered|cancelled"
        varchar shipping_method
        int shipping_fee
        int discount
        int subtotal
        int total
        varchar receiver_name
        varchar receiver_phone
        varchar receiver_email
        text address_text
        text note
        varchar payment_method "cod | qr — gộp từ payments"
        varchar payment_status "pending|paid|failed|refunded"
        varchar pay_code UK "mã ngẫu nhiên trong nội dung CK"
        datetime pay_expires_at "hạn QR"
        datetime paid_at
        varchar transaction_code
        varchar ship_carrier "vận đơn gộp vào đây"
        varchar tracking_code
        datetime shipped_at
        datetime delivered_at
        datetime created_at
    }

    order_items {
        int id PK
        varchar order_id FK1
        int variant_id FK2 "biến thể đã bán"
        varchar name "snapshot"
        int price "snapshot"
        int quantity
        varchar color "snapshot"
        varchar size "snapshot"
        text image
    }

    vouchers {
        int id PK
        varchar code UK
        varchar type "percent|fixed|freeship"
        int value
        varchar description
        int min_order
        datetime expiry
        int usage_limit
        int used_count
    }

    reviews {
        int id PK
        int user_id FK1
        int variant_id FK2 "màu/size đã mua"
        int rating "1-5"
        varchar title
        text content
        text admin_reply "phản hồi shop"
        boolean approved
        datetime created_at
    }

    notifications {
        int id PK
        int user_id FK1
        varchar order_id FK2 "gắn với đơn, null được"
        int voucher_id FK3 "gắn với voucher, null được"
        varchar title
        text content
        varchar type "order|promo|system"
        boolean read
        datetime created_at
    }

    banners {
        int id PK
        varchar eyebrow
        varchar title
        text subtitle
        text image
        varchar cta
        boolean active
        int sort_order
    }
```

## 3. Các quyết định thiết kế để "logic chặt chẽ"

### 3.1. Đặt hàng — transaction nguyên tử (không tin client)
`POST /api/orders` tính lại **toàn bộ** giá/phí/giảm giá từ DB, rồi gói mọi thao
tác ghi trong một transaction — bất kỳ bước nào lỗi thì rollback sạch:
1. Lấy sản phẩm + biến thể từ DB, **variant bắt buộc tồn tại** (không đặt được "hàng ma").
2. Trừ kho **có điều kiện** `UPDATE ... WHERE stock >= qty` — MySQL khóa dòng nên
   hai đơn tranh món cuối thì chỉ một đơn thành công, đơn kia rollback (chống race).
3. Tăng `vouchers.used_count` có điều kiện `< usage_limit` (chống vượt lượt khi song song).
4. Xóa giỏ + tạo thông báo.

### 3.2. "Mỗi khách 1 lần / mã voucher" — không cần bảng riêng
Thay bảng lượt-dùng, kiểm bằng truy vấn:
`orders(user_id, voucher_id, status ≠ cancelled)` đã tồn tại → từ chối. Đơn bị hủy
không tính, nên khách được dùng lại mã đúng như kỳ vọng.

### 3.3. Hủy đơn — hoàn tác đầy đủ
`restoreOrderResources()` (dùng chung cho khách tự hủy và admin hủy): cộng lại kho
theo `variant_id`, trừ lượt bán của sản phẩm (JOIN qua `variants.product_id`),
hoàn `vouchers.used_count`, và đóng thanh toán (`payment_status`: đã trả → refunded,
chưa trả → failed). Tất cả trong transaction.

### 3.4. Thanh toán gộp trong `orders` — vẫn an toàn với SePay
- Quan hệ Order–Payment vốn **1-1** (một đơn một lần thanh toán) → gộp cột
  `payment_method / payment_status / pay_code / pay_expires_at / paid_at /
  transaction_code` thẳng vào `orders`, bớt một bảng và một lần JOIN.
- `pay_code` **ngẫu nhiên + UNIQUE** → kẻ xấu không claim đơn người khác,
  webhook tìm đơn bằng một truy vấn.
- **Chống webhook trùng không cần bảng log**: SePay retry tới 7 lần, nhưng
  `UPDATE orders SET payment_status='paid' WHERE id=? AND payment_status='pending'`
  chỉ khớp đúng **một lần** — các lần sau count = 0, trả "đã xử lý" và thoát.
- Webhook chỉ xác nhận khi: đúng tiền vào, đủ số tiền, còn hạn QR.

### 3.5. Snapshot & phi chuẩn hóa
- `order_items` lưu `name/price/color/size/image` tại thời điểm mua → hóa đơn cũ
  không đổi khi sản phẩm đổi giá hay admin đổi tên màu.
- `products.rating/review_count` cập nhật lại mỗi khi duyệt đánh giá → khỏi JOIN + AVG khi render danh sách.

### 3.6. Gộp vận đơn vào `orders`
Quan hệ Order–Shipment vốn 1-1, nên gộp `ship_carrier/tracking_code/shipped_at/delivered_at`
thẳng vào `orders` — bớt một bảng mà không mất thông tin. (Cùng lý do với thanh toán ở 3.4.)

### 3.7. `variants` là "đơn vị bán" — cart_items / order_items / reviews CHỈ trỏ vào nó
Sản phẩm của một dòng giỏ/đơn/đánh giá luôn suy ra được qua `variants.product_id`,
nên giữ thêm FK `product_id` ở ba bảng này là **dư thừa** (vi phạm chuẩn hóa: một
sự thật lưu hai nơi, có thể mâu thuẫn — variant thuộc sản phẩm A mà `product_id`
ghi sản phẩm B). Đã bỏ:

| Bảng | FK còn lại | Ghi chú |
|---|---|---|
| `cart_items` | `variant_id` NOT NULL | UNIQUE `(user_id, variant_id)` |
| `order_items` | `variant_id` NOT NULL | **giữ** `color`/`size` làm snapshot in hóa đơn |
| `reviews` | `variant_id` NOT NULL | đánh giá gắn đúng màu/size; cần lọc theo sản phẩm thì JOIN qua variant |

Vì sao `order_items` vẫn giữ `color`/`size`: đó là dữ liệu **lịch sử**. Sang năm
admin sửa "Đen" → "Đen nhám" thì hóa đơn cũ vẫn phải in đúng chữ khách đã mua.
`variant_id` dùng để hoàn kho, `color/size` dùng để hiển thị — hai mục đích khác nhau.

### 3.8. Thông báo khuyến mãi — có nguồn phát, có FK
- `notifications.order_id` (NULL được) — thông báo về đơn, bấm vào mở đúng đơn.
- `notifications.voucher_id` (NULL được) — thông báo về mã giảm giá.
- `POST /api/admin/vouchers` tạo voucher xong sẽ `createMany` thông báo `promo`
  cho toàn bộ khách, gắn `voucher_id`; cả hai nằm trong một transaction.

### 3.9. Quy ước ký hiệu trên sơ đồ (min, max — 2 ký hiệu mỗi đầu dây)
- Cột nhãn: `PK` (gạch chân), `FK1`/`FK2`/`FK3` (in nghiêng, đánh số theo thứ tự cột), `UK`.
- **Mỗi đầu dây có đủ 2 ký hiệu (tối thiểu, tối đa)**:
  - vòng tròn + chân quạ = **(0, n)** — phía bảng con: một bản ghi cha có thể chưa có con nào;
  - hai gạch = **(1, 1)** — FK bắt buộc: bản ghi con luôn thuộc đúng một cha;
  - vòng tròn + gạch = **(0, 1)** — FK NULL được (quan hệ tùy chọn, vd `orders.voucher_id`).
- File `.drawio` được **sinh tự động** bằng `python docs/prisma-to-drawio.py`
  từ `schema.prisma`, mỗi quan hệ đi một kênh dọc riêng nên các dây không chồng lên nhau.

## 4. Ánh xạ Prisma

Schema tại [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) — 13 bảng
trên MySQL/MariaDB (XAMPP), database `hoangnha_fashion` (utf8mb4),
`mysql://root:@localhost:3306/hoangnha_fashion`. Model Prisma giữ tên PascalCase
(`Order`, `Voucher`...) nhưng ánh xạ xuống bảng số nhiều snake_case bằng
`@@map`/`@map` — code backend không đổi cách gọi, còn DB đúng chuẩn đặt tên.
Xem dữ liệu qua phpMyAdmin, hoặc import thẳng [`docs/hoangnha_fashion.sql`](./hoangnha_fashion.sql).
