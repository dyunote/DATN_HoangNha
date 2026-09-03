# PROMPT: Đăng nhập bằng Google & Facebook (OAuth 2.0) — dự án hoangnha

> Dán nguyên khối dưới đây vào Claude Code khi đang mở thư mục `D:\hoangnha`.

---

Thêm chức năng **đăng nhập bằng Google và Facebook** cho dự án này. Đọc code hiện có trước khi sửa, bám theo kiến trúc sẵn có, **không** thêm framework auth mới (không NextAuth, không Passport, không Firebase).

## Bối cảnh dự án

- **Backend**: `backend/` — Express 4 + TypeScript (ESM, `tsx`), Prisma 6 + MySQL, JWT tự ký bằng `jsonwebtoken`. Auth hiện tại nằm ở `src/routes/auth.ts` và `src/lib/auth.ts` (`signToken`, `authRequired`). Biến môi trường nạp bằng `process.loadEnvFile` trong `src/lib/env.ts` — **không cài dotenv**.
- **Frontend**: `frontend/` — React 19 + Vite + TypeScript strict + Tailwind v4 + react-router-dom 7 + axios. Phiên đăng nhập do `src/context/AuthContext.tsx` quản lý: JWT lưu ở `localStorage` khoá `hn-token`, khôi phục phiên bằng `authApi.me()`.
- Nút social hiện tại ở `frontend/src/components/auth/SocialLogin.tsx` chỉ là demo (bắn toast).

## Yêu cầu chức năng

1. Chỉ **Google** và **Facebook**. **Xoá hẳn nút GitHub** khỏi `SocialLogin.tsx` (bỏ luôn import `FaGithub`), đổi lưới còn 2 cột.
2. Nút hoạt động ở cả trang `Login.tsx` và `Register.tsx`.
3. Đăng nhập lần đầu bằng social → tự tạo user mới (role `CUSTOMER`) + tạo `Notification` chào mừng giống luồng `/register`.
4. Nếu email trả về đã tồn tại trong bảng `users` → **liên kết** vào tài khoản đó (ghi `googleId`/`facebookId`), không tạo user trùng, không báo lỗi.
5. Sau khi thành công: có JWT trong `localStorage`, `AuthContext` chuyển sang `authenticated`, điều hướng về trang trước đó (hoặc `/`), hiện toast chào mừng.

## Thiết kế kỹ thuật bắt buộc

Dùng **Authorization Code flow phía server** (không dùng implicit, không nhét client secret vào frontend). Luồng:

```
[FE] click nút  →  window.location.href = `${API}/auth/oauth/google`
[BE] GET /api/auth/oauth/:provider          → redirect 302 sang trang consent kèm state
[BE] GET /api/auth/oauth/:provider/callback → đổi code lấy access token → lấy profile
                                            → tìm/tạo user → ký JWT của app
                                            → redirect về ${FRONTEND_URL}/auth/callback#token=...
[FE] /auth/callback đọc token từ hash → lưu localStorage → gọi me() → điều hướng
```

Giải thích cho tôi hiểu **tại sao** chọn flow này thay vì trả token qua query string hay qua postMessage popup.

### Backend

- Tạo file mới `backend/src/lib/oauth.ts` chứa cấu hình 2 provider (authorize URL, token URL, profile URL, scope) và hàm `exchangeCode()` / `fetchProfile()` trả về kiểu chung:
  ```ts
  type OAuthProfile = { providerId: string; email: string | null; name: string; avatar: string | null }
  ```
- Gọi HTTP bằng `fetch` có sẵn của Node 20 — **không cài axios/node-fetch/googleapis ở backend**.
- Endpoint tham chiếu:
  - Google: authorize `https://accounts.google.com/o/oauth2/v2/auth` (scope `openid email profile`), token `https://oauth2.googleapis.com/token`, profile `https://www.googleapis.com/oauth2/v3/userinfo` (lấy `sub`, `email`, `email_verified`, `name`, `picture`).
  - Facebook: authorize `https://www.facebook.com/{FB_GRAPH_VERSION}/dialog/oauth` (scope `email,public_profile`), token `https://graph.facebook.com/{FB_GRAPH_VERSION}/oauth/access_token`, profile `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)`. Đặt `FB_GRAPH_VERSION` thành hằng số một chỗ để dễ nâng cấp.
- Route mới đặt trong `backend/src/routes/auth.ts` (giữ nguyên các route cũ), mount dưới `/api/auth`.
- **Chống CSRF**: sinh `state` là JWT ngắn hạn (5 phút) ký bằng `JWT_SECRET`, payload gồm `provider`, `nonce` ngẫu nhiên (`crypto.randomUUID()`) và `redirect` (đường dẫn nội bộ người dùng muốn quay lại). Callback phải `jwt.verify` state và kiểm tra `provider` khớp; sai/hết hạn → redirect về `${FRONTEND_URL}/login?error=...`. Giải thích ngắn vì sao state là bắt buộc.
- **Chỉ nhận `redirect` là đường dẫn tương đối bắt đầu bằng `/`** (chặn open redirect).
- Xử lý các ca lỗi, redirect về `/login?error=<mã>` chứ không trả JSON trần:
  - người dùng bấm "Huỷ" ở màn consent (`?error=access_denied`);
  - Google trả `email_verified === false` → từ chối;
  - Facebook **không trả email** (tài khoản đăng ký bằng số điện thoại, hoặc user gỡ quyền email) → từ chối kèm thông báo tiếng Việt rõ ràng, gợi ý đăng nhập bằng email/mật khẩu. Đây là ca thật hay gặp, đừng giả định luôn có email.
- Nếu `GOOGLE_CLIENT_ID`/`FACEBOOK_APP_ID` chưa cấu hình → route trả 503 với thông báo dễ hiểu, **server vẫn khởi động bình thường**.

### Prisma / CSDL

Chỉ **thêm cột vào bảng `users`**, không tạo bảng mới (ERD đang chốt 13 bảng):

```prisma
googleId     String?  @unique @map("google_id")
facebookId   String?  @unique @map("facebook_id")
passwordHash String?  @map("password_hash")   // đổi thành nullable
```

- `passwordHash` phải nullable vì user tạo bằng social chưa có mật khẩu. Sửa mọi chỗ đang giả định nó là `string`:
  - `POST /login`: `passwordHash` null → trả 401 kèm thông báo "Tài khoản này đăng nhập bằng Google/Facebook";
  - `PUT /me/password`: null → cho phép **đặt mật khẩu lần đầu** (không yêu cầu `oldPassword`), hoặc trả lỗi rõ ràng — chọn một và giải thích lý do;
  - kiểm tra thêm `routes/admin.ts`, `routes/me.ts` và `prisma/seed.ts`.
- Migrate bằng `npm run db:push` (dự án dùng `db push`, không dùng migrate).

### Frontend

- `frontend/src/components/auth/SocialLogin.tsx`: bỏ GitHub, mỗi nút gán `window.location.href = \`${API_BASE}/auth/oauth/google\`` + `?redirect=` là `location.pathname` hiện tại. Lấy base URL từ đúng chỗ `src/api/client.ts` đang dùng, không hardcode.
- Trang mới `frontend/src/pages/auth/OAuthCallback.tsx`: đọc token từ `location.hash`, `localStorage.setItem('hn-token', token)`, xoá hash khỏi URL (`history.replaceState`) để token không nằm lại trên thanh địa chỉ, gọi `me()` rồi `navigate(redirect, { replace: true })`. Có trạng thái loading và trạng thái lỗi.
- `AuthContext`: thêm hàm `loginWithToken(token: string): Promise<void>` để trang callback dùng lại đúng một nguồn sự thật, **không** viết logic set state rời rạc trong page.
- Thêm route `/auth/callback` vào `App.tsx`. Trang `Login.tsx` đọc `?error=` và hiện toast lỗi tiếng Việt.
- Giữ nguyên phong cách UI hiện tại (Tailwind v4, biến màu `ink`/`muted`, `rounded-btn`, dark mode). Icon dùng `react-icons/fa6` như đang có.

### Cấu hình

- Bổ sung vào `backend/.env.example` (giữ đúng style comment tiếng Việt không dấu như file hiện tại), kèm hướng dẫn từng bước lấy key:
  ```
  GOOGLE_CLIENT_ID=""
  GOOGLE_CLIENT_SECRET=""
  FACEBOOK_APP_ID=""
  FACEBOOK_APP_SECRET=""
  # URL frontend de redirect ve sau khi dang nhap xong
  FRONTEND_URL="http://localhost:5173"
  # URL goc cua backend, dung de dung redirect_uri (phai khop 100% voi cau hinh tren Google/Facebook)
  BACKEND_URL="http://localhost:4000"
  ```
- Viết file `docs/oauth-setup.md`: các bước tạo OAuth Client trên Google Cloud Console (Authorized redirect URI: `http://localhost:4000/api/auth/oauth/google/callback`), tạo app trên Facebook Developers + thêm sản phẩm Facebook Login (Valid OAuth Redirect URI tương ứng), lưu ý app Facebook ở chế độ Development chỉ đăng nhập được bằng tài khoản đã thêm vào Roles/Testers, và lưu ý khi deploy phải đổi domain + bật HTTPS.

## Ràng buộc code

- TypeScript strict, **không dùng `any`**; comment giải thích bằng **tiếng Việt**.
- Hạn chế tối đa thư viện ngoài — nếu bạn thấy bắt buộc phải cài gói nào, hỏi tôi trước và nói rõ vì sao không tự viết được.
- Code gọn, tách hàm rõ ràng; đừng nhồi toàn bộ logic vào một route handler dài.
- Không đụng vào các tính năng khác (SePay, chat, voucher, admin).

## Cách làm việc

1. Trước khi code: đọc `backend/src/routes/auth.ts`, `backend/src/lib/auth.ts`, `backend/src/index.ts`, `frontend/src/context/AuthContext.tsx`, `frontend/src/api/services.ts`, `frontend/src/api/client.ts`, `frontend/src/App.tsx` rồi trình bày **kế hoạch ngắn gọn + danh sách file sẽ tạo/sửa** cho tôi duyệt. Chưa sửa gì ở bước này.
2. Sau khi tôi duyệt mới code, làm backend trước rồi frontend.
3. Xong thì chạy `npx tsc --noEmit` ở cả hai thư mục và `npm run lint` ở frontend, sửa hết lỗi.
4. Cuối cùng viết cho tôi phần tổng kết: luồng dữ liệu từ lúc bấm nút đến lúc có JWT, các quyết định bảo mật (state, open redirect, token qua hash, email chưa xác thực) và cách tự test thủ công.
