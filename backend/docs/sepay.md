# Tích hợp thanh toán SePay (chuyển khoản ngân hàng)

Khách quét QR → chuyển khoản → ngân hàng báo SePay → SePay gọi webhook về backend →
đơn hàng tự chuyển sang **đã thanh toán** → màn hình khách tự nhảy sang "Thành công".

Toàn bộ mất khoảng 5–15 giây, không cần ai bấm xác nhận thủ công.

---

## 1. Luồng hoạt động

```
Khách bấm "Đặt hàng" (chọn Chuyển khoản QR)
   │
   ├─> POST /api/orders
   │     • Trừ tồn kho (giữ hàng cho khách)
   │     • Tạo Payment với payCode ngẫu nhiên + hạn 15 phút
   │     • Trả về qrUrl
   │
   ├─> Frontend hiện QR, poll GET /api/sepay/orders/:id/payment-status mỗi 3s
   │
   │   [Khách quét QR bằng app ngân hàng và chuyển khoản]
   │
   ├─> Ngân hàng → SePay → POST /api/sepay/webhook
   │     • Xác thực API Key
   │     • Ghi SepayWebhookLog (transactionId UNIQUE → chống trùng)
   │     • Khớp payCode, kiểm tra đủ tiền, chưa hết hạn
   │     • Payment: pending → paid | Order: pending → confirmed
   │
   └─> Lần poll tiếp theo thấy status='paid' → hiện "Thanh toán thành công"
```

---

## 2. Cấu hình trên my.sepay.vn

**Bước 1 — Lấy số tài khoản.** Vào [my.sepay.vn](https://my.sepay.vn) → mục Tài khoản ngân hàng,
ghi lại **số tài khoản** và **tên ngân hàng** đã liên kết.
Mã ngân hàng đúng chuẩn tra tại [qr.sepay.vn/banks.json](https://qr.sepay.vn/banks.json)
(ví dụ: `MBBank`, `Vietcombank`, `ACB`, `TPBank`).

**Bước 2 — Mở đường cho webhook.** SePay nằm trên Internet, không gọi được vào
`localhost:4000`. Chạy ngrok để tạo URL công khai trỏ về máy bạn:

```bash
ngrok http 4000
```

Copy dòng `Forwarding` dạng `https://abc-123.ngrok-free.app`.

> Mỗi lần khởi động lại, ngrok đổi URL → phải sửa lại webhook trên my.sepay.vn.
> Tài khoản ngrok miễn phí có thể đăng ký 1 domain cố định để tránh việc này.

**Bước 3 — Tạo webhook.** my.sepay.vn → menu **Webhooks** → **+ Thêm webhook**:

| Trường | Giá trị |
|---|---|
| Sự kiện | **Có tiền vào** |
| URL | `https://abc-123.ngrok-free.app/api/sepay/webhook` |
| Tài khoản | Chọn tài khoản ngân hàng của bạn |
| Bảo mật | **API Key** → nhập một chuỗi ngẫu nhiên dài |

**Bước 4 — Điền `.env`:**

```env
SEPAY_ACCOUNT="0123456789"          # số tài khoản của bạn
SEPAY_BANK="MBBank"                 # mã ngân hàng
SEPAY_API_KEY="chuoi-vua-dat-o-buoc-3"
SEPAY_EXPIRE_MINUTES=15
SEPAY_ALLOW_SIMULATE="false"        # tắt khi đã có webhook thật
```

**Bước 5 — Áp dụng schema mới:**

```bash
npx prisma generate    # tạo lại type cho Payment.payCode và SepayWebhookLog
npx prisma db push     # thêm cột/bảng mới vào MySQL
```

---

## 3. Kiểm tra

**Cách 1 — Không tốn tiền.** Trang chi tiết webhook trên my.sepay.vn có nút
**Gửi thử**, bắn payload mẫu vào endpoint của bạn. Xem kết quả ở
[Nhật ký webhooks](https://my.sepay.vn/webhookslog).

**Cách 2 — Giao dịch thật.** Đặt một đơn, chuyển đúng số tiền với đúng nội dung
`HNxxxxxx`. Màn hình phải tự nhảy sang thành công trong ~5 giây.

**Cách 3 — Giả lập.** Đặt `SEPAY_ALLOW_SIMULATE="true"`, màn hình QR sẽ có nút
"Tôi đã chuyển khoản". Nút này gọi lại đúng endpoint webhook với payload y hệt
SePay gửi, nên test được toàn bộ đường đi mà không cần chuyển tiền.
**Luôn để `false` khi chạy thật** — nếu không, khách tự bấm là được xác nhận đơn.

---

## 4. Những quyết định bảo mật trong code

**Mã thanh toán phải ngẫu nhiên.** `genPayCode()` dùng `crypto.randomBytes(6)`
chứ không dùng mã đơn hay số tăng dần. Mã này là thứ duy nhất xác định đơn nào
được trả tiền — nếu đoán được (HN001, HN002...), kẻ xấu chuyển 1.000đ kèm mã của
đơn người khác là hệ thống ghi nhầm.

**Xác thực API Key bằng so sánh constant-time.** `safeEqual()` dùng
`crypto.timingSafeEqual`. So sánh thường (`a === b`) dừng ngay ở ký tự khác đầu
tiên; kẻ tấn công đo thời gian phản hồi có thể dò ra key từng ký tự.

**Chống trùng bằng UNIQUE ở tầng DB.** SePay retry tới 7 lần khi endpoint lỗi, nên
cùng một giao dịch có thể về nhiều lần. Code dựa vào `transactionId UNIQUE` và bắt
lỗi P2002, thay vì "SELECT xem có chưa rồi INSERT" — cách sau bị lọt khi hai
request chạy song song.

**UPDATE có điều kiện thay vì đọc-rồi-ghi.** `updateMany({ where: { status: 'pending' } })`
đảm bảo chỉ một request đổi được trạng thái, dù nhiều webhook đến cùng lúc.

**Chuyển thiếu tiền thì KHÔNG tự xác nhận.** Khách chuyển 10k cho đơn 500k mà được
giao hàng thì shop lỗ. Trường hợp này giữ `pending`, admin đối soát tay.

**Luôn trả `success: true` kể cả khi không khớp đơn.** Nếu trả lỗi, SePay retry 7
lần cho một giao dịch vốn không thuộc về shop (ví dụ người thân chuyển tiền vào
cùng tài khoản đó).

**Nên bật HMAC-SHA256 khi chạy thật.** API Key xác minh request đến từ SePay nhưng
không bảo vệ nội dung payload. Xem [tài liệu xác thực](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc).

---

## 5. Endpoint

| Method | URL | Bảo vệ | Công dụng |
|---|---|---|---|
| POST | `/api/sepay/webhook` | API Key | SePay gọi khi có tiền vào |
| GET | `/api/sepay/orders/:id/payment-status` | JWT | Frontend poll trạng thái |
| POST | `/api/sepay/simulate/:id` | JWT + cờ dev | Giả lập đã chuyển khoản |

---

## 6. Khi webhook không chạy

Kiểm tra theo thứ tự:

1. **ngrok còn sống không** — mở URL ngrok trên trình duyệt, phải thấy JSON của API.
2. **URL webhook trên my.sepay.vn có đúng không** — phải kèm `/api/sepay/webhook`.
3. **API Key hai bên có khớp không** — sai key sẽ trả 401, xem ở Nhật ký webhooks.
4. **Nội dung chuyển khoản** — khách sửa nội dung thì không khớp được `payCode`,
   phải đối soát tay.
5. Xem log trong bảng `SepayWebhookLog` — cột `matched = 0` nghĩa là đã nhận
   webhook nhưng không khớp đơn nào.

Nguồn: [Tích hợp webhook SePay](https://docs.sepay.vn/tich-hop-webhooks.html) ·
[Tạo QR và form thanh toán](https://developer.sepay.vn/vi/sepay-webhooks/tao-qr-va-form-thanh-toan)
