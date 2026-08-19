# PROMPT — Hoàn thiện website Hoàng Nha Fashion

> Copy toàn bộ nội dung dưới đây (từ dòng `---` đầu tiên) dán vào Claude Code / Cursor tại thư mục gốc `D:\hoangnha`.

---

## BỐI CẢNH DỰ ÁN

Tôi đang làm đồ án tốt nghiệp: website bán quần áo **Hoàng Nha Fashion**, monorepo tại thư mục gốc.

**Stack:**
- Frontend: React 19 + TypeScript + Vite + TailwindCSS v4 + React Router + Recharts + framer-motion + lucide-react (`frontend/`, cổng 5173)
- Backend: Express 4 + Prisma + MySQL (XAMPP) + JWT + bcrypt (`backend/`, cổng 4000)
- DB: 13 bảng, schema tại `backend/prisma/schema.prisma`, seed tại `backend/prisma/seed.ts`

**Cấu trúc backend:**
```
backend/src/
├── index.ts                 # Express app, đăng ký route
├── lib/                     # prisma client, auth middleware (authRequired, adminRequired)
└── routes/                  # auth.ts products.ts catalog.ts orders.ts me.ts
                             # admin.ts sepay.ts chat.ts upload.ts extras.ts
```

**Cấu trúc frontend:**
```
frontend/src/
├── api/          # axios client + services (adminApi, authApi...)
├── components/   # ui/ layout/ product/ home/ auth/ chat/ checkout/
├── context/      # Auth, Cart, Wishlist, Theme, Toast
├── hooks/        # useProducts...
└── pages/        # Home, Shop, ProductDetail, CartPage, Checkout,
                  # auth/, account/, admin/
```

**Quy ước code bắt buộc tuân theo:**
- TypeScript **strict**, không dùng `any`
- TailwindCSS, không viết CSS riêng trừ khi bắt buộc
- **Comment bằng tiếng Việt**, giải thích *lý do* chứ không mô tả lại code
- Hạn chế tối đa thư viện ngoài — ưu tiên tự viết
- Backend: **không tin dữ liệu client**, mọi giá tiền/quyền hạn phải tính lại và kiểm tra từ DB
- Mọi thao tác ghi nhiều bảng phải nằm trong 1 transaction Prisma
- Tôi là sinh viên đang học: mỗi thay đổi lớn hãy **giải thích ngắn gọn lý do thiết kế** trước khi code

---

## PHẠM VI CÔNG VIỆC

Website hiện hoàn thành ~70%. Dưới đây là **8 hạng mục cần làm**, xếp theo thứ tự ưu tiên.

### KHÔNG làm những thứ sau (đã chốt bỏ):
- ❌ Lọc sản phẩm theo màu / size
- ❌ Mua hàng khi chưa đăng nhập (guest checkout) — giữ nguyên bắt buộc đăng nhập
- ❌ Tích hợp VNPay / ZaloPay / MoMo — chỉ giữ SePay đang có
- ❌ Chuyển Wishlist lên database — giữ nguyên localStorage
- ❌ Đồng bộ trạng thái vận chuyển tự động — giữ nguyên admin cập nhật tay

---

## NHÓM A — LỖI CHẾT NGƯỜI (làm trước tiên)

> Ba mục này **có UI nhưng bấm vào không chạy**. Hội đồng chấm rất hay click trúng.

### A1. Quên mật khẩu — hiện đang giả 100%

**Vấn đề:** `frontend/src/pages/auth/ForgotPassword.tsx` có UI 4 bước (nhập email → OTP 6 số → mật khẩu mới → xong) nhưng chỉ `setStep()` ở client. `backend/src/routes/auth.ts` **không có** endpoint nào cho luồng này. Mật khẩu mới nhập xong không ghi vào đâu cả.

**Cần làm:**
1. Thêm bảng `PasswordReset` vào `schema.prisma`:
   - `id`, `userId`, `otpHash` (băm bằng bcrypt, **không lưu OTP thô**), `expiresAt` (5 phút), `usedAt`, `attempts` (đếm số lần nhập sai), `createdAt`
2. Ba endpoint trong `auth.ts`:
   - `POST /api/auth/forgot-password` — nhận email, sinh OTP 6 số, lưu bản băm, hết hạn 5 phút. **Luôn trả về 200 kể cả email không tồn tại** (chống dò email đã đăng ký). Chống spam: mỗi email tối đa 1 mã / 60 giây.
   - `POST /api/auth/verify-otp` — kiểm tra OTP còn hạn, chưa dùng, sai quá 5 lần thì vô hiệu mã. Trả về `resetToken` (JWT ngắn hạn 10 phút, scope riêng `purpose: 'reset'` để không dùng thay token đăng nhập được).
   - `POST /api/auth/reset-password` — nhận `resetToken` + mật khẩu mới (tối thiểu 8 ký tự), hash bcrypt, cập nhật `users.password`, đánh dấu `usedAt`.
3. **Gửi OTP:** dùng `nodemailer` + Gmail SMTP (app password), cấu hình qua `.env` (`SMTP_USER`, `SMTP_PASS`). Nếu thiếu biến môi trường thì fallback **in OTP ra console backend** kèm cảnh báo rõ ràng — để demo offline vẫn chạy được.
4. Nối `ForgotPassword.tsx` vào 3 API trên, xử lý loading / lỗi / đếm ngược nút "Gửi lại mã".

### A2. Cấu hình hệ thống — hiện lưu không được

**Vấn đề:** `frontend/src/pages/admin/AdminSettings.tsx` dòng ~45 bấm Lưu ra toast *"Chưa lưu được: bản rút gọn chưa có bảng Setting trong database"*.

**Cần làm:**
1. Thêm bảng `Setting` vào `schema.prisma`: `key` (`@id`), `value` (`@db.Text`), `group` (website / contact / shipping / payment), `updatedAt`
2. Endpoint:
   - `GET /api/settings` — công khai, chỉ trả các key an toàn cho frontend (tên shop, hotline, email, địa chỉ, mạng xã hội, phí ship, ngưỡng freeship)
   - `GET /api/admin/settings` + `PUT /api/admin/settings` — admin, nhận object `{key: value}`, ghi bằng `upsert` trong transaction
3. Seed sẵn giá trị mặc định trong `seed.ts`
4. **Quan trọng — cấu hình phải có tác dụng thật, không phải để ngắm:**
   - Phí ship và ngưỡng freeship trong `orders.ts` hiện **hardcode 30.000 / 55.000 / ngưỡng 500.000** → phải đọc từ bảng `Setting`
   - Frontend `Footer.tsx` đọc hotline / email / địa chỉ / social từ `GET /api/settings`
5. Nối `AdminSettings.tsx` vào API, bỏ toast giả.

### A3. Quản lý người dùng — hiện chỉ xem được

**Vấn đề:** `admin.ts` chỉ có `GET /admin/customers`. Không sửa, không khóa, không đổi quyền.

**Cần làm:**
1. Thêm cột `status` vào model `User`: `active | locked` (mặc định `active`)
2. Endpoint trong `admin.ts`:
   - `PUT /api/admin/customers/:id` — sửa tên, sđt, vai trò (`user`/`admin`)
   - `PATCH /api/admin/customers/:id/status` — khóa / mở khóa tài khoản
   - `DELETE /api/admin/customers/:id` — chỉ cho xóa khi **chưa có đơn hàng nào**; đã có đơn thì trả lỗi 409 và gợi ý khóa tài khoản thay vì xóa (giữ toàn vẹn dữ liệu lịch sử)
3. **Quy tắc an toàn bắt buộc:** admin không được tự khóa / tự xóa / tự hạ quyền chính mình; không được xóa admin cuối cùng của hệ thống.
4. Middleware `authRequired` phải chặn user có `status = 'locked'` → trả 403 kèm thông báo rõ.
5. `AdminCustomers.tsx`: thêm nút Sửa / Khóa / Xóa + modal xác nhận + badge trạng thái.

---

## NHÓM B — YÊU CẦU ĐỀ BÀI CÒN THIẾU

### B1. Thống kê & Báo cáo (quan trọng nhất nhóm này)

**Vấn đề:** `admin.ts` `GET /stats` chỉ tính doanh thu **6 tháng gần nhất, hardcode** (dòng ~31-40). Đề bài yêu cầu doanh thu theo **năm, quý, tháng, tuần, ngày** + thống kê tồn kho + nguyên vật liệu.

**Cần làm:**

**a) API thống kê doanh thu linh hoạt**
- `GET /api/admin/stats/revenue?period=day|week|month|quarter|year&from=&to=`
- Gom nhóm theo `period`, chỉ tính đơn `status != 'cancelled'` và `paymentStatus = 'paid'` (hoặc COD đã `delivered`) — **nêu rõ trong comment vì sao chọn tiêu chí này**
- Trả về: `[{ label, revenue, orderCount, itemCount }]` + tổng, giá trị đơn trung bình, % tăng trưởng so với kỳ trước
- **Phải trả về đủ các mốc trống** (tháng không có đơn vẫn trả revenue = 0) — nếu không biểu đồ sẽ đứt quãng

**b) API báo cáo tồn kho**
- `GET /api/admin/stats/inventory`
- Tồn theo từng biến thể (màu × size), tổng tồn theo sản phẩm, theo danh mục
- Cảnh báo: **sắp hết** (`stock <= 5`) và **hết hàng** (`stock = 0`)
- Sản phẩm tồn lâu không bán được (`sold = 0`)

**c) Nguyên vật liệu — hiện chưa có bảng nào**
- Thêm 2 model vào `schema.prisma`:
  - `Material`: `id, name, unit` (mét/cuộn/cái), `quantity`, `minQuantity` (ngưỡng cảnh báo), `costPerUnit`, `supplier`, `note`, `createdAt`, `updatedAt`
  - `MaterialLog`: `id, materialId, type` (`import` nhập / `export` xuất), `quantity`, `note`, `createdAt` — để truy vết biến động kho
- CRUD `/api/admin/materials` + `POST /api/admin/materials/:id/log` (nhập/xuất kho, **cập nhật `quantity` và ghi log trong cùng transaction**)
- Trang mới `frontend/src/pages/admin/AdminMaterials.tsx` + thêm mục vào sidebar `AdminLayout.tsx`
- Seed vài nguyên vật liệu mẫu (vải cotton, vải lụa, cúc, chỉ, khóa kéo...)

**d) Trang thống kê frontend** — nâng cấp `AdminStats.tsx`:
- Bộ chọn kỳ: Ngày / Tuần / Tháng / Quý / Năm + chọn khoảng thời gian tùy ý
- Biểu đồ đường doanh thu theo kỳ đã chọn (Recharts, đã có sẵn)
- Biểu đồ cột tồn kho theo danh mục
- Bảng cảnh báo sắp hết hàng + nguyên vật liệu dưới ngưỡng
- Nút **Xuất Excel** (dùng thư viện `xlsx`) cho báo cáo doanh thu và tồn kho

### B2. Tích hợp API giao hàng — Giao Hàng Nhanh (GHN) sandbox

**Vấn đề:** hiện phí ship hardcode, `shipCarrier` / `trackingCode` admin gõ tay.

**Cần làm:**
1. Đăng ký GHN sandbox (`https://5sao.ghn.dev`), token + shopId lưu `.env`: `GHN_TOKEN`, `GHN_SHOP_ID`, `GHN_ENV=sandbox`
2. `backend/src/lib/ghn.ts` — wrapper gọi API GHN bằng `fetch`:
   - Lấy danh sách tỉnh / huyện / xã
   - `calculateFee()` — tính phí theo địa chỉ + khối lượng
   - `createOrder()` — tạo vận đơn, trả về mã vận đơn
   - `trackOrder()` — tra trạng thái theo mã vận đơn
3. Endpoint:
   - `GET /api/shipping/provinces` · `/districts?provinceId=` · `/wards?districtId=`
   - `POST /api/shipping/fee` — trả phí ship thật theo địa chỉ khách chọn
   - `POST /api/admin/orders/:id/ship` — admin bấm tạo vận đơn GHN, lưu `trackingCode` + `shipCarrier` vào đơn
4. **Đổi cấu trúc địa chỉ:** `Address` hiện lưu text tự do → cần thêm `provinceId`, `districtId`, `wardCode` để GHN tính được phí. Viết migration cẩn thận, dữ liệu cũ giữ nguyên phần text.
5. `Checkout.tsx`: 3 dropdown Tỉnh → Huyện → Xã (load nối tiếp), chọn xong **gọi API tính phí ship thật** thay cho phí cứng.
6. **Bắt buộc có fallback:** GHN sandbox lỗi / hết token → tự động quay về bảng phí trong `Setting` (mục A2) và báo cho người dùng biết. Demo không được chết vì API bên thứ ba.

### B3. So sánh sản phẩm

**Cần làm (thuần frontend, không cần bảng DB):**
1. `context/CompareContext.tsx` — tối đa 4 sản phẩm, lưu `localStorage` (giống `WishlistContext` đang có, đọc file đó để làm theo cùng phong cách)
2. Nút "So sánh" trên `ProductCard.tsx` và `ProductDetail.tsx`
3. Thanh nổi dưới màn hình hiện các sản phẩm đang chọn + nút "So sánh ngay" / "Xóa hết"
4. Trang `/so-sanh` — bảng so sánh: ảnh, tên, giá, danh mục, thương hiệu, đánh giá TB, số đã bán, màu có sẵn, size có sẵn, tồn kho, mô tả
5. **Tự động tô sáng ô khác biệt** giữa các sản phẩm (giá rẻ nhất, đánh giá cao nhất) — đây là điểm ăn tiền khi demo

---

## NHÓM C — HOÀN THIỆN CHẤT LƯỢNG

### C1. Quản lý hiển thị Trang chủ

**Vấn đề:** admin chỉ sửa được banner. Hero, Lookbook, Trending, FlashSale, Instagram đều hardcode trong component.

**Cần làm:**
1. Thêm model `HomeSection`: `id, key` (hero/lookbook/trending/flashsale/instagram/newsletter/about), `title`, `subtitle`, `image`, `link`, `isVisible`, `sortOrder`, `config` (JSON cho dữ liệu riêng từng loại)
2. CRUD `/api/admin/home-sections` + `GET /api/home-sections` công khai
3. Trang `AdminHomepage.tsx`: bật/tắt từng section, sửa tiêu đề/ảnh, **kéo thả đổi thứ tự** (dùng HTML5 drag & drop native, không thêm thư viện)
4. `Home.tsx` render động theo dữ liệu này thay vì cứng
5. Fallback về nội dung mặc định hiện tại nếu API lỗi — trang chủ không bao giờ được trắng

### C2. Đăng nhập / Đăng ký

1. **`components/auth/SocialLogin.tsx` là nút giả** (Google/Facebook bấm không có gì xảy ra) → **xóa hẳn** khỏi trang Login/Register. Nút chết còn tệ hơn không có nút.
2. Chống dò mật khẩu: cùng một email sai quá 5 lần trong 15 phút → khóa tạm 15 phút (đếm trong bộ nhớ là đủ, không cần bảng).
3. Đăng ký: kiểm tra email đúng định dạng + số điện thoại VN (`0[35789]xxxxxxxx`) ở **cả frontend và backend**.
4. (Nếu còn thời gian) Xác thực email khi đăng ký — tái sử dụng luồng OTP đã viết ở mục A1.

### C3. Tìm kiếm

1. `GET /api/products/suggest?q=` — trả tối đa 8 gợi ý (tên sản phẩm + danh mục khớp)
2. Ô tìm kiếm trong `Header.tsx`: gọi API với **debounce 300ms**, hiện dropdown gợi ý, điều hướng bằng phím ↑ ↓ Enter Esc
3. Lưu 5 từ khóa tìm gần nhất vào `localStorage`, hiện khi ô tìm kiếm còn trống
4. Backend `products.ts`: mở rộng `q` tìm cả trong `description` và tên danh mục, không chỉ tên sản phẩm

### C4. Chat AI — lưu lịch sử

**Vấn đề:** `chat.ts` chạy được (Anthropic SDK + rule-bot fallback) nhưng **không lưu gì vào DB**, admin không xem được khách hỏi gì.

**Cần làm:**
1. Model `ChatSession` (`id`, `userId?`, `guestId`, `createdAt`, `lastMessageAt`) và `ChatMessage` (`id`, `sessionId`, `role` user/assistant, `content`, `createdAt`)
2. `chat.ts` ghi lại mọi lượt hỏi–đáp; khách chưa đăng nhập dùng `guestId` sinh từ `localStorage`
3. `GET /api/me/chat-history` — user xem lại cuộc trò chuyện cũ, `ChatWidget.tsx` khôi phục hội thoại khi mở lại
4. Trang `AdminChats.tsx` — admin xem danh sách phiên chat + nội dung, để biết khách hay hỏi gì

---

## CÁCH THỰC HIỆN — YÊU CẦU VỀ QUY TRÌNH

0. **VIỆC ĐẦU TIÊN, TRƯỚC MỌI THỨ KHÁC:** website hiện đang **chạy được bình thường** — đây là bản đồ án sắp bảo vệ, không được làm hỏng. Hãy:
   - Kiểm tra `git status`. Nếu còn thay đổi chưa commit, commit lại trước (`git add -A && git commit -m "checkpoint truoc khi nang cap"`).
   - Tạo nhánh riêng: `git checkout -b feature/hoan-thien-do-an`. **Mọi thay đổi làm trên nhánh này**, `main` giữ nguyên bản chạy được để còn đường lùi.
   - Nhắc tôi backup database trước khi đụng vào schema.

1. **Làm tuần tự theo thứ tự A1 → A2 → A3 → B1 → B2 → B3 → C1 → C2 → C3 → C4.** Xong mỗi mục thì dừng lại báo cáo và chờ tôi xác nhận, **không làm liền một mạch nhiều mục**.
2. Trước khi code mỗi mục: **tóm tắt kế hoạch trong 5-10 dòng** (sửa file nào, thêm bảng nào, có ảnh hưởng dữ liệu cũ không), tôi duyệt rồi mới code.
3. **CẢNH BÁO VỀ DATABASE — đọc kỹ trước khi động vào `schema.prisma`:**

   Dự án này **chưa từng dùng migration** — không có thư mục `backend/prisma/migrations/`, toàn bộ schema tạo bằng `db:push`. Vì vậy:

   - **TUYỆT ĐỐI KHÔNG chạy `npx prisma migrate dev`** khi chưa baseline. Prisma sẽ báo "Drift detected" và đề nghị **reset toàn bộ database** — mất sạch dữ liệu đang có.
   - Mặc định: **tiếp tục dùng `npx prisma db:push`** cho mọi thay đổi schema. Tất cả thay đổi trong tài liệu này đều là **thêm bảng / thêm cột có giá trị mặc định**, `db:push` xử lý được mà không mất dữ liệu.
   - Nếu tôi yêu cầu chuyển sang migration, phải baseline đúng quy trình: `mkdir migrations/0_init` → `prisma migrate diff --from-empty --to-schema-datamodel schema.prisma --script > migrations/0_init/migration.sql` → `prisma migrate resolve --applied 0_init`, rồi mới migrate tiếp.
   - **Trước mỗi lần đổi schema:** nhắc tôi export backup qua phpMyAdmin, và tự chạy lệnh dump nếu được:
     `C:\xampp\mysql\bin\mysqldump.exe -u root hoangnha_fashion > backup-<ngày>.sql`
   - Thêm cột vào bảng đã có dữ liệu thì cột đó **bắt buộc phải nullable hoặc có `@default`**, nếu không MySQL sẽ từ chối.
   - Cập nhật `seed.ts` cho bảng mới, nhưng **seed phải viết kiểu `upsert`**, không được `deleteMany` toàn bảng — chạy lại seed không được xóa đơn hàng thật.
   - Cập nhật lại `docs/hoangnha_fashion.sql` và `docs/erd.md` (ERD đang ghi 13 bảng, thêm bảng phải sửa tài liệu — đồ án chấm cả tài liệu)
4. Sau mỗi mục: chạy `npx tsc --noEmit` ở cả frontend lẫn backend, phải **sạch lỗi TypeScript** mới coi là xong.
5. Không phá vỡ tính năng đang chạy. Nếu buộc phải sửa code cũ, nói rõ sửa gì và vì sao.
6. Biến môi trường mới phải ghi vào `.env.example` kèm hướng dẫn lấy giá trị ở đâu.
7. **Không hardcode** dữ liệu vào frontend nữa — thiếu chỗ nào lấy ở đâu thì hỏi tôi.

**Bắt đầu:** đọc `README.md`, `backend/prisma/schema.prisma`, `backend/src/routes/auth.ts` và `frontend/src/pages/auth/ForgotPassword.tsx`, rồi trình bày kế hoạch cho **mục A1**.
