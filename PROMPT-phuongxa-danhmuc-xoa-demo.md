# Prompt cho Claude Code — Hoàng Nha Fashion

> Dán nguyên phần dưới đây vào Claude Code (mở ở thư mục gốc `hoangnha/`).

---

Dự án: **Hoàng Nha Fashion** — React 19 + TypeScript + TailwindCSS v4 (`frontend/`) và Express + Prisma + MySQL + JWT (`backend/`). Đọc `README.md`, `docs/erd.md`, `backend/prisma/schema.prisma` trước khi sửa bất cứ thứ gì.

**Quy tắc chung khi làm việc:**
- TypeScript strict, không dùng `any`; Tailwind cho toàn bộ style; comment bằng tiếng Việt.
- Không thêm thư viện ngoài. Nếu thật sự cần thì phải nói rõ lý do và chờ tôi duyệt.
- Bám pattern có sẵn (axios services trong `frontend/src/api/services.ts`, context, `backend/src/routes/*`). Không refactor lan man ngoài phạm vi 3 phần dưới đây.
- Mỗi phần: **báo cáo trước khi code** (liệt kê file sẽ sửa + cách làm), tôi duyệt rồi mới sửa.
- Sau mỗi phần: chạy `npm run build` ở cả `frontend/` và `backend/`, đảm bảo không lỗi type.
- Giải thích ngắn gọn *tại sao* làm vậy, coi tôi là người đang học.

Làm lần lượt 3 phần, xong phần nào tổng kết phần đó.

---

## Phần 1 — Bỏ cấp "Quận / Huyện", địa chỉ chỉ còn Phường / Xã + Tỉnh / Thành phố

**Lý do:** từ 01/07/2025 Việt Nam bỏ cấp huyện, địa chỉ hành chính chỉ còn **2 cấp: Tỉnh/Thành phố → Phường/Xã**. Database và form hiện tại vẫn đang lưu cả `district` lẫn `ward` nên sai chuẩn và bắt khách nhập thừa.

Mục tiêu: **xoá hẳn trường `district`**, giữ `ward` (nhãn "Phường / Xã"), thứ tự hiển thị địa chỉ là `street, ward, city`.

### 1.1 Database (làm trước, vì frontend phụ thuộc)

- `backend/prisma/schema.prisma` (dòng 63–64, model `Address`): xoá `district String`, giữ `ward String`.
- Viết migration SQL thủ công theo đúng pattern có sẵn trong `backend/prisma/` (`migrate-*.sql`), đặt tên `migrate-drop-district.sql`. Nội dung 2 bước, **không được làm mất dữ liệu**:
  1. Gộp dữ liệu cũ vào `ward` cho những dòng `ward` đang rỗng (địa chỉ cũ chỉ có district), ví dụ:
     `UPDATE addresses SET ward = district WHERE ward = '' AND district <> '';`
  2. `ALTER TABLE addresses DROP COLUMN district;`
  Nói cho tôi biết vì sao phải chạy UPDATE **trước** khi DROP.
- Cập nhật `docs/erd.md`, `docs/hoangnha.dbml` và `docs/hoangnha_fashion.sql` cho khớp (bảng `addresses` bớt 1 cột).
- `backend/prisma/seed.ts` dòng 184–185 và 340: bỏ `district`, gộp phần địa danh vào `ward`/`addressText` sao cho đọc vẫn tự nhiên (ví dụ `'86 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh'`).

> Lưu ý: `orders.addressText` là **chuỗi đã đóng băng** lúc đặt hàng — không đụng vào đơn cũ, đơn cũ giữ nguyên địa chỉ tại thời điểm mua. Chỉ đổi cách *tạo mới* chuỗi này.

### 1.2 Backend

- `backend/src/routes/me.ts` dòng 16, 23, 35, 37: bỏ `district` khỏi destructuring và khỏi `data` của `create`/`update`.
- Thêm validate cho POST/PUT địa chỉ (hiện đang gần như không có): `name`, `phone`, `street`, `ward`, `city` bắt buộc, `phone` phải khớp regex số điện thoại VN (`^0\d{9}$` sau khi bỏ khoảng trắng). Thiếu thì trả 400 kèm câu tiếng Việt rõ ràng, đừng để Prisma văng 500.
- Rà cả `backend/src/routes/orders.ts` xem có chỗ nào ghép chuỗi địa chỉ từ `district` không, sửa luôn.

### 1.3 Frontend

- `frontend/src/types/index.ts` dòng 96: xoá `district: string` khỏi `interface Address`.
- `frontend/src/pages/account/Addresses.tsx`:
  - dòng 15 `EMPTY_FORM`, dòng 46 (đổ form khi sửa), dòng 164 (hiển thị), dòng 215–216 (2 ô input): bỏ `district`, chỉ còn ô **"Phường / Xã"** với placeholder `Phường Bến Nghé`.
  - Sắp lại lưới form cho cân sau khi bớt 1 ô (đừng để 1 ô lẻ chiếm `sm:col-span-2` một cách vô lý).
- `frontend/src/pages/Checkout.tsx`:
  - dòng 60 state `newAddr`: `{ street: '', ward: '', city: '' }`.
  - dòng 383–386: ô **"Quận / Huyện"** đổi thành **"Phường / Xã"**, nối vào `newAddr.ward`, và bổ sung xử lý lỗi giống 2 ô kia (`error={addrErrors.ward}` + xoá lỗi khi gõ) — hiện ô này đang thiếu, gõ sai không báo gì.
  - dòng 155–156, 169, 180–181, 332: sửa lại phần lưu địa chỉ và ghép `addressText` thành `[street, ward, city]`.
  - Thêm `ward` vào phần validate trước khi đặt hàng (`addrErrors`) — đang bắt buộc `street` và `city` nhưng bỏ trống phường xã vẫn đặt được.
- Grep lại toàn repo (`frontend/src`, `backend/src`, `docs/`) với các từ khoá `district`, `Quận`, `Huyện` để chắc không sót chỗ nào.

---

## Phần 2 — Xoá sạch phần demo / giả lập

Web sắp nộp/deploy thật, không được để lối tắt giả lập thanh toán — bất kỳ ai gọi đúng API là tự đánh dấu đơn của mình "đã thanh toán".

Xoá hẳn (không phải comment lại, không phải ẩn nút):

1. **Nút giả lập chuyển khoản** — `frontend/src/components/checkout/SepayQrPanel.tsx` dòng ~99 và ~210 (`'Tôi đã chuyển khoản (giả lập để test)'`, toast `'Chức năng giả lập đang tắt trên máy chủ'`), kèm state `simulating` và handler liên quan.
2. **`frontend/src/api/services.ts` dòng ~228** — hàm gọi API giả lập chuyển khoản.
3. **`backend/src/routes/sepay.ts`** — route `POST /simulate/:id` (khoảng dòng 165–190) và mọi nhánh code chỉ tồn tại cho nó.
4. **`backend/src/routes/extras.ts`** — toàn bộ route `POST /payments/:orderId/confirm` ("Xác nhận thanh toán thủ công (chỉ dùng demo)"). Nếu xoá xong file này rỗng thì bỏ luôn file và gỡ `app.use(...)` tương ứng trong `backend/src/index.ts`.
5. **`backend/src/lib/sepay.ts` dòng ~16** — cờ `allowSimulate` / biến môi trường `SEPAY_ALLOW_SIMULATE`. Gỡ khỏi `.env`, `.env.example` và `backend/src/lib/env.ts` nếu có khai báo.
6. **`frontend/src/pages/admin/AdminOrders.tsx` dòng ~378** — nút "Xuất hóa đơn PDF" hiện chỉ `toast('... (demo)')`. Xoá nút này (đừng giữ nút bấm vào không làm gì — đó là lỗi UX nặng hơn là không có nút).
7. **`README.md`**:
   - dòng ~100: bỏ dòng mô tả endpoint giả lập.
   - dòng ~26 và ~76: đang ghi *"Mock data (fallback khi backend tắt)"* và *"Frontend tự fallback sang mock data"* — **sai sự thật**, mock đã bị xoá từ trước (xem comment trong `frontend/src/data/index.ts` và `frontend/src/hooks/useCategories.ts`). Viết lại cho đúng: dữ liệu lấy hoàn toàn từ API, backend tắt thì hiện màn hình lỗi + nút thử lại.

Sau đó **liệt kê ra cho tôi duyệt trước khi xoá** (đừng tự xoá) các file rác nghi ngờ ở repo:
`_verify_grid.html` (gốc repo), `backend/q1.json`, `backend/q2.json`, `backend/dev.log`, và thư mục `backend/dist/` nếu nó đang bị commit vào git. Kèm 1 dòng giải thích mỗi file dùng để làm gì và vì sao nên/không nên xoá. Nhớ kiểm `.gitignore` xem `dist/`, `*.log`, `.env` đã được bỏ qua chưa.

**Quan trọng:** sau khi xoá, luồng thanh toán chuyển khoản chỉ còn đường thật qua `POST /api/sepay/webhook`. Chạy thử `npm run build` cả 2 bên và kiểm tra không còn import chết (`grep -rn "simulate\|allowSimulate\|payments/.*confirm"`).

---

## Phần 3 — Làm lại chức năng "Thêm danh mục" cho ra hồn

File chính: `frontend/src/pages/admin/AdminCategories.tsx` và route `backend/src/routes/admin.ts` dòng 534–546.

Hiện tại nó đang quá sơ sài: bắt admin tự gõ slug, ảnh phải dán URL, backend không validate gì cả.

### 3.1 Backend — `backend/src/routes/admin.ts` (dòng 535, 539, 543)

`POST /categories` hiện chỉ có 2 dòng, không kiểm tra gì. Cần:

1. **Validate**: `name` bắt buộc, trim, độ dài 2–50. `slug` nếu client không gửi thì **server tự sinh** từ `name` (tái dùng đúng cách bỏ dấu tiếng Việt đã có ở dòng 264 của file này — tách ra thành helper dùng chung `slugify()` trong `backend/src/lib/`, đừng chép code lần 2). Slug chỉ chấp nhận `^[a-z0-9-]+$`.
2. **Chống trùng slug**: `slug` là `@unique`, hiện trùng là Prisma văng `P2002` → response 500 khó hiểu. Bắt lỗi này, trả **409** với câu `"Slug 'ao-khoac' đã tồn tại — hãy đổi tên khác"`. Áp dụng cho cả `PUT`.
3. **`DELETE /categories/:id`**: UI đang hứa với admin là *"danh mục đang có sản phẩm thì server sẽ từ chối"* nhưng backend không hề kiểm — thực tế Prisma sẽ ném lỗi khoá ngoại và ra 500. Sửa: đếm `product` thuộc danh mục, nếu `> 0` trả **409** kèm `"Danh mục đang có N sản phẩm, hãy chuyển sản phẩm sang danh mục khác trước"`.
4. `image` cho phép rỗng, nhưng nếu có thì phải là `/uploads/...` hoặc `http(s)://...`.

### 3.2 Frontend — form thêm/sửa danh mục

1. **Tự sinh slug từ tên** (giống cách người dùng thật mong đợi): gõ "Áo khoác" → slug tự thành `ao-khoac`. Viết helper `slugify()` bỏ dấu tiếng Việt (`normalize('NFD')` + bỏ dấu thanh + `đ→d`) đặt trong `frontend/src/lib/`. Quy tắc: chỉ tự sinh khi admin **chưa tự sửa** ô slug; một khi họ gõ tay vào ô slug thì thôi không ghi đè nữa (dùng một flag `slugTouched`). Khi **sửa** danh mục cũ thì mặc định không tự đổi slug — đổi slug là đổi URL, hỏng link cũ. Có nút nhỏ "Tạo lại từ tên" cho ai muốn.
2. **Upload ảnh thay vì bắt dán URL**. Làm y hệt pattern đã có trong `frontend/src/pages/admin/AdminProducts.tsx` (`toDataUrl()` dòng ~184, `handleFiles()` dòng ~192, UI vùng thả ảnh dòng ~506–545, gọi `adminApi.uploadImage`):
   - Ô ảnh có preview vuông, nút xoá ảnh, spinner `Loader2` khi đang tải.
   - Chặn file không phải ảnh và file > 5MB, báo bằng toast.
   - **Vẫn giữ** ô dán URL bên cạnh cho ai muốn dùng link ngoài — nhưng để nó là lựa chọn phụ, không phải cách duy nhất.
3. **Lỗi hiện dưới từng field, không phải toast**. `FormField` đã có prop `error` (xem cách `Checkout.tsx` dùng). Thay `toast('Vui lòng nhập tên và slug', 'warning')` ở dòng 65 bằng state `errors` theo field, và xoá lỗi ngay khi admin gõ lại.
4. **Reset form khi đóng modal** — hiện đóng rồi mở lại "Thêm mới" vẫn còn dữ liệu cũ nếu vừa bấm sửa (`openForm` có set lại nhưng nút X/click nền thì không). Reset trong `onClose`.
5. **Ảnh rỗng làm vỡ card**: dòng 129 `<img src={c.image}>` — `image` được phép rỗng nên trình duyệt hiện icon ảnh hỏng. Thêm fallback: nếu không có ảnh thì render một khối placeholder (chữ cái đầu của tên danh mục trên nền xám) thay vì thẻ `<img>`.
6. **Hiện lỗi 409 từ server ra đúng chỗ**: slug trùng thì gắn lỗi vào ô slug, không phải toast chung chung. `apiMessage()` đã có sẵn để lấy message.
7. **Không cho xoá khi còn sản phẩm**: `ConfirmDialog` hiện chỉ cảnh báo bằng chữ. Vì `catalogApi.categories()` đã trả về `count`, hãy dùng nó: `count > 0` thì nút xoá disable + tooltip giải thích, khỏi để admin bấm rồi ăn lỗi.
8. Kiểm tra `refreshCategories()` (dòng 73, 90) có đồng bộ đủ: menu Header, section danh mục trang chủ, dropdown chọn danh mục trong form sản phẩm.

### 3.3 Kiểm thử tay sau khi xong

Tự đi qua và báo cáo kết quả từng bước:
- Thêm danh mục tên tiếng Việt có dấu → slug đúng, ảnh upload lên hiện được ở trang chủ.
- Thêm 2 danh mục trùng tên → cái thứ 2 báo lỗi 409 ngay dưới ô slug, không phải 500.
- Bỏ trống tên → lỗi hiện dưới ô tên, không gọi API.
- Sửa danh mục đang có sản phẩm → slug không tự đổi.
- Xoá danh mục còn sản phẩm → bị chặn, câu thông báo dễ hiểu.
- Xoá danh mục rỗng → thành công, menu/trang chủ cập nhật ngay không cần F5.

---

## Cuối cùng

Tổng kết lại: danh sách file đã sửa, migration cần chạy (`npx prisma db push` hay chạy file SQL nào), env đã gỡ, và những gì tôi cần kiểm tra lại bằng tay trước khi commit. Đề xuất luôn 3 commit message tiếng Việt tương ứng 3 phần.
