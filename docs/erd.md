# Hoàng Nha Fashion — Thiết kế Cơ sở dữ liệu (ERD — 15 bảng)

Bản rút gọn: đủ cho một shop thời trang bình thường, logic chặt chẽ, không có
các chức năng vận hành nâng cao (điểm thưởng, đổi/trả, nhật ký kho, bộ sưu tập,
tạp chí...). Giữ lại tích hợp thanh toán chuyển khoản **SePay**.

## 1. Danh sách 15 bảng

| # | Bảng | Vai trò |
|---|---|---|
| 1 | **User** | Tài khoản khách + admin |
| 2 | **Address** | Sổ địa chỉ giao hàng |
| 3 | **Category** | Danh mục sản phẩm |
| 4 | **Product** | Sản phẩm (cờ `isNew/isBestSeller/flashSale` thay cho bảng bộ sưu tập/chiến dịch) |
| 5 | **ProductImage** | Ảnh gallery của sản phẩm |
| 6 | **Variant** | Biến thể màu × size × tồn kho (+ giá riêng) |
| 7 | **CartItem** | Giỏ hàng (đồng bộ theo tài khoản) — trỏ vào `Variant` |
| 8 | **Order** | Đơn hàng (đã gộp thông tin vận đơn) |
| 9 | **OrderItem** | Dòng đơn hàng — snapshot giá lúc mua |
| 10 | **Payment** | Giao dịch thanh toán (COD / chuyển khoản QR) |
| 11 | **SepayWebhookLog** | Nhật ký webhook SePay — chống ghi nhận trùng, tra ngược về `Order` |
| 12 | **Voucher** | Mã giảm giá |
| 13 | **Review** | Đánh giá sản phẩm (+ phản hồi của shop) |
| 14 | **Notification** | Thông báo cho khách |
| 15 | **Banner** | Banner hero trang chủ (CMS) |

> **Wishlist** (yêu thích) lưu ở `localStorage` phía trình duyệt, không cần bảng.
> **"Đã xem gần đây"** cũng lưu `localStorage`.

## 2. Sơ đồ ERD (Mermaid)

```mermaid
erDiagram
    USER ||--o{ ADDRESS : "có"
    USER ||--o{ ORDER : "đặt"
    USER ||--o{ REVIEW : "viết"
    USER ||--o{ CART_ITEM : "có"
    USER ||--o{ NOTIFICATION : "nhận"

    CATEGORY ||--o{ PRODUCT : "chứa"
    PRODUCT ||--o{ PRODUCT_IMAGE : "có"
    PRODUCT ||--o{ VARIANT : "có"
    PRODUCT ||--o{ REVIEW : "được đánh giá"
    PRODUCT ||--o{ CART_ITEM : "trong"
    PRODUCT ||--o{ ORDER_ITEM : "trong"

    VARIANT ||--o{ CART_ITEM : "được chọn"
    VARIANT ||--o{ ORDER_ITEM : "được bán"
    VARIANT |o--o{ REVIEW : "được đánh giá"

    ORDER ||--|{ ORDER_ITEM : "gồm"
    ORDER ||--|| PAYMENT : "thanh toán"
    ORDER |o--o{ SEPAY_WEBHOOK_LOG : "đối soát"
    ORDER |o--o{ NOTIFICATION : "sinh ra"
    VOUCHER ||--o{ ORDER : "áp dụng"
    VOUCHER |o--o{ NOTIFICATION : "quảng bá"

    USER {
        int id PK
        string name
        string email UK
        string passwordHash
        string phone
        string avatar
        string gender
        string birthday
        string role "CUSTOMER | ADMIN"
        datetime createdAt
    }

    ADDRESS {
        int id PK
        int userId FK1
        string label
        string name
        string phone
        string street
        string ward
        string district
        string city
        boolean isDefault
    }

    CATEGORY {
        int id PK
        string name
        string slug UK
        text image
    }

    PRODUCT {
        int id PK
        int categoryId FK1
        string name
        string slug UK
        text description
        int price
        int oldPrice
        string brand
        string material
        float rating "denormalized"
        int reviewCount
        int sold
        boolean isNew
        boolean isBestSeller
        boolean isTrending
        boolean flashSale
        datetime createdAt
    }

    PRODUCT_IMAGE {
        int id PK
        int productId FK1
        text url
        int sortOrder
    }

    VARIANT {
        int id PK
        int productId FK1
        string color
        string colorHex
        string size
        int stock
        int price "null = dùng giá sản phẩm"
        int oldPrice
    }

    CART_ITEM {
        int id PK
        int userId FK1
        int productId FK2
        int variantId FK3 "biến thể đang chọn"
        int quantity
    }

    ORDER {
        string id PK "HN-yymmdd-xxxx"
        int userId FK1
        int voucherId FK2 "null được"
        string status "pending|confirmed|shipping|delivered|cancelled"
        string paymentMethod "cod | qr"
        string shippingMethod
        int shippingFee
        int discount
        int subtotal
        int total
        string receiverName
        string receiverPhone
        string receiverEmail
        text addressText
        text note
        string shipCarrier "vận đơn gộp vào đây"
        string trackingCode
        datetime shippedAt
        datetime deliveredAt
        datetime createdAt
    }

    ORDER_ITEM {
        int id PK
        string orderId FK1
        int productId FK2
        int variantId FK3 "biến thể đã bán"
        string name "snapshot"
        int price "snapshot"
        int quantity
        string color "snapshot"
        string size "snapshot"
        text image
    }

    PAYMENT {
        int id PK
        string orderId FK1,UK
        string method "cod | qr"
        string status "pending|paid|failed|refunded"
        int amount
        string transactionCode
        string payCode UK "mã ngẫu nhiên trong nội dung CK"
        datetime expiresAt
        datetime paidAt
    }

    SEPAY_WEBHOOK_LOG {
        int id PK
        bigint transactionId UK "chống trùng"
        string orderId FK1 "null khi chưa khớp đơn"
        string gateway
        string payCode
        int amount
        string transferType "in | out"
        string referenceCode
        boolean matched
        text rawBody
        datetime createdAt
    }

    VOUCHER {
        int id PK
        string code UK
        string type "percent|fixed|freeship"
        int value
        string description
        int minOrder
        datetime expiry
        int usageLimit
        int usedCount
    }

    REVIEW {
        int id PK
        int userId FK1
        int productId FK2
        int variantId FK3 "màu/size đã mua, null được"
        int rating "1-5"
        string title
        text content
        text adminReply "phản hồi shop"
        boolean approved
        datetime createdAt
    }

    NOTIFICATION {
        int id PK
        int userId FK1
        string orderId FK2 "gắn với đơn, null được"
        int voucherId FK3 "gắn với voucher, null được"
        string title
        text content
        string type "order|promo|system"
        boolean read
        datetime createdAt
    }

    BANNER {
        int id PK
        string eyebrow
        string title
        text subtitle
        text image
        string cta
        boolean active
        int sortOrder
    }
```

## 3. Các quyết định thiết kế để "logic chặt chẽ"

### 3.1. Đặt hàng — transaction nguyên tử (không tin client)
`POST /api/orders` tính lại **toàn bộ** giá/phí/giảm giá từ DB, rồi gói mọi thao
tác ghi trong một transaction — bất kỳ bước nào lỗi thì rollback sạch:
1. Lấy sản phẩm + biến thể từ DB, **variant bắt buộc tồn tại** (không đặt được "hàng ma").
2. Trừ kho **có điều kiện** `UPDATE ... WHERE stock >= qty` — MySQL khóa dòng nên
   hai đơn tranh món cuối thì chỉ một đơn thành công, đơn kia rollback (chống race).
3. Tăng `Voucher.usedCount` có điều kiện `< usageLimit` (chống vượt lượt khi song song).
4. Xóa giỏ + tạo thông báo.

### 3.2. "Mỗi khách 1 lần / mã voucher" — không cần bảng riêng
Thay bảng lượt-dùng, kiểm bằng truy vấn:
`Order(userId, voucherId, status ≠ cancelled)` đã tồn tại → từ chối. Đơn bị hủy
không tính, nên khách được dùng lại mã đúng như kỳ vọng.

### 3.3. Hủy đơn — hoàn tác đầy đủ
`restoreOrderResources()` (dùng chung cho khách tự hủy và admin hủy): cộng lại kho,
trừ lượt bán, hoàn `Voucher.usedCount`, và đóng `Payment` (đã trả → refunded,
chưa trả → failed). Tất cả trong transaction.

### 3.4. Thanh toán chuyển khoản qua SePay — an toàn
- `Payment.payCode` **ngẫu nhiên** (không đoán được) → kẻ xấu không claim đơn người khác.
- `SepayWebhookLog.transactionId` **UNIQUE** → SePay retry nhiều lần cũng chỉ ghi nhận một lần.
- Webhook chỉ xác nhận khi: đúng tiền vào, đủ số tiền, còn hạn QR, và đổi trạng thái
  `pending → paid` có điều kiện (chống hai webhook song song).

### 3.5. Snapshot & phi chuẩn hóa
- `OrderItem` lưu `name/price/image` tại thời điểm mua → hóa đơn cũ không đổi khi sản phẩm đổi giá.
- `Product.rating/reviewCount` cập nhật lại mỗi khi duyệt đánh giá → khỏi JOIN + AVG khi render danh sách.

### 3.6. Gộp vận đơn vào Order
Quan hệ Order–Shipment vốn 1-1, nên gộp `shipCarrier/trackingCode/shippedAt/deliveredAt`
thẳng vào Order — bớt một bảng mà không mất thông tin.

### 3.7. Variant là "đơn vị bán" — CartItem / OrderItem / Review trỏ thẳng vào nó
Trước đây giỏ hàng và dòng đơn chỉ lưu hai chuỗi `color` + `size`, rồi mỗi lần
cần tồn kho lại đi dò `Variant(productId, color, size)`. Hệ quả:

- Chuỗi sai chính tả hoặc admin đổi tên màu → dò không ra biến thể, **hủy đơn
  không hoàn được kho** (`updateMany` khớp 0 dòng nhưng không báo lỗi).
- Không có ràng buộc khóa ngoại nên DB cho phép lưu tổ hợp màu/size **không tồn
  tại** (dữ liệu mẫu cũ có đúng lỗi này: giỏ hàng trỏ tới "sản phẩm 8 / Kem"
  trong khi sản phẩm 8 không có màu Kem).

Nay cả ba bảng đều có `variantId` là khóa ngoại thật:

| Bảng | Cột mới | Ghi chú |
|---|---|---|
| `CartItem` | `variantId` NOT NULL | bỏ hẳn `color`/`size`; UNIQUE đổi thành `(userId, variantId)` |
| `OrderItem` | `variantId` NOT NULL | **giữ** `color`/`size` làm snapshot in hóa đơn |
| `Review` | `variantId` NULL | đánh giá đúng màu/size đã mua; NULL = đánh giá chung |

Vì sao `OrderItem` vẫn giữ `color`/`size`: đó là dữ liệu **lịch sử**. Sang năm
admin sửa "Đen" → "Đen nhám" thì hóa đơn cũ vẫn phải in đúng chữ khách đã mua.
`variantId` dùng để hoàn kho, `color/size` dùng để hiển thị — hai mục đích khác nhau.

### 3.8. Webhook SePay tra được về đơn hàng
`SepayWebhookLog` thêm `orderId` (NULL được). Nullable vì tiền có thể vào tài
khoản mà **chưa biết của đơn nào** (người thân chuyển tiền, khách ghi sai nội
dung, chuyển thiếu). Khi khớp được `payCode` → ghi `orderId` vào log, đối soát
sau này chỉ cần `JOIN Order` thay vì mở cột `rawBody` đọc JSON bằng mắt.
`transactionId` vẫn UNIQUE — đó mới là khóa chống ghi nhận trùng.

### 3.9. Thông báo khuyến mãi — có nguồn phát, có FK
`Notification.type` vốn có giá trị `promo` nhưng **không chỗ nào sinh ra**, nên
khách không bao giờ nhận được tin về chương trình khuyến mãi. Đã bổ sung:

- `Notification.orderId` (NULL được) — thông báo về đơn, bấm vào mở đúng đơn.
- `Notification.voucherId` (NULL được) — thông báo về mã giảm giá.
- `POST /api/admin/vouchers` tạo voucher xong sẽ `createMany` thông báo `promo`
  cho toàn bộ khách, gắn `voucherId`; cả hai nằm trong một transaction để không
  có cảnh voucher tạo rồi mà thông báo lỗi.

### 3.10. Quy ước ký hiệu trên sơ đồ
- Cột nhãn: `PK`, `FK1`/`FK2`/`FK3` (đánh số theo thứ tự cột trong bảng), `UK`.
- Đầu dây dùng **chân quạ**: phía nhiều = chân quạ, phía một = gạch đơn, vòng
  tròn = khóa ngoại NULL được. Không ghi thêm chữ "1:N" trên dây vì ký hiệu đã
  thể hiện đủ, ghi thêm chỉ làm rối hình.
- File `.drawio` được **sinh tự động** bằng `python docs/prisma-to-drawio.py`
  từ `schema.prisma`, mỗi quan hệ đi một kênh dọc riêng nên các dây không chồng lên nhau.

## 4. Ánh xạ Prisma

Schema tại [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) — 15 bảng
trên MySQL/MariaDB (XAMPP), database `hoangnha_fashion` (utf8mb4),
`mysql://root:@localhost:3306/hoangnha_fashion`. Xem dữ liệu qua phpMyAdmin.
