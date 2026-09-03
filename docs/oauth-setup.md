# Cấu hình đăng nhập Google & Facebook (OAuth 2.0)

Tài liệu này hướng dẫn lấy khoá cho hai nút **Đăng nhập bằng Google** và
**Đăng nhập bằng Facebook** ở trang `/dang-nhap` và `/dang-ky`.

> **Chưa cấu hình vẫn chạy được.** Để trống các biến bên dưới thì server khởi
> động bình thường, mọi tính năng khác hoạt động như cũ; chỉ riêng hai nút social
> trả về lỗi 503 kèm thông báo dễ hiểu.

---

## 0. Tổng quan luồng

```
[FE] bấm nút        →  window.location.href = /api/auth/oauth/google?redirect=/gio-hang
[BE] GET  /api/auth/oauth/google           → 302 sang màn hình đồng ý của Google (kèm state)
[BE] GET  /api/auth/oauth/google/callback  → đổi code lấy access token → lấy hồ sơ
                                           → tìm/tạo user → ký JWT của app
                                           → 302 về  FRONTEND_URL/auth/callback#token=...
[FE] /auth/callback → đọc token từ hash → lưu localStorage → gọi /auth/me → điều hướng
```

Hai địa chỉ **redirect URI** cần khai báo trên console của nhà cung cấp:

| Provider | Redirect URI (môi trường dev) |
| --- | --- |
| Google | `http://localhost:4000/api/auth/oauth/google/callback` |
| Facebook | `http://localhost:4000/api/auth/oauth/facebook/callback` |

Địa chỉ này phải khớp **100%** với `BACKEND_URL` trong `.env` — sai một dấu `/`
ở cuối, sai `http` / `https`, hay sai số cổng đều bị từ chối với lỗi
`redirect_uri_mismatch`.

---

## 1. Google — lấy `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`

1. Mở <https://console.cloud.google.com/> và đăng nhập.
2. Tạo project mới (góc trên bên trái, cạnh logo Google Cloud) — ví dụ
   `hoangnha-fashion`. Nếu đã có project thì chọn project đó.
3. Vào menu **APIs & Services → OAuth consent screen**:
   - **User Type**: chọn `External` → **Create**.
   - Điền **App name** (`Hoàng Nha Fashion`), **User support email**,
     **Developer contact email**. Các mục còn lại để trống được.
   - Ở bước **Scopes**, bấm **Add or remove scopes** và tick ba scope:
     `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - Ở bước **Test users**, thêm chính email Google bạn sẽ dùng để thử.
     Khi app còn ở trạng thái *Testing*, **chỉ những email trong danh sách này
     mới đăng nhập được**.
4. Vào **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - **Application type**: `Web application`.
   - **Name**: đặt gì cũng được, ví dụ `hoangnha-web`.
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: bấm **+ ADD URI** và dán chính xác:

     ```
     http://localhost:4000/api/auth/oauth/google/callback
     ```

   - Bấm **Create**.
5. Hộp thoại hiện ra **Client ID** và **Client secret** — copy vào `backend/.env`:

   ```
   GOOGLE_CLIENT_ID="123456789-abcxyz.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-..."
   ```

---

## 2. Facebook — lấy `FACEBOOK_APP_ID` và `FACEBOOK_APP_SECRET`

1. Mở <https://developers.facebook.com/> → **My Apps → Create App**.
2. **Use case**: chọn `Authenticate and request data from users with Facebook
   Login` → **Next**.
3. **App type**: chọn `Consumer` (nếu được hỏi) → điền **App name**
   (`Hoàng Nha Fashion`) và email liên hệ → **Create app**.
4. Trong màn hình quản trị app, vào **Add products → Facebook Login → Set up**,
   chọn nền tảng **Web**. (Có thể bỏ qua phần "Quickstart" — ta không dùng SDK
   JavaScript của Facebook, toàn bộ luồng chạy phía server.)
5. Vào **Facebook Login → Settings** (menu trái), điền ô
   **Valid OAuth Redirect URIs** chính xác:

   ```
   http://localhost:4000/api/auth/oauth/facebook/callback
   ```

   Bật **Client OAuth login** và **Web OAuth login**. Bấm **Save changes**.
6. Vào **App settings → Basic**: copy **App ID** và **App secret**
   (bấm **Show**, phải nhập lại mật khẩu Facebook) vào `backend/.env`:

   ```
   FACEBOOK_APP_ID="1234567890123456"
   FACEBOOK_APP_SECRET="abcdef0123456789abcdef0123456789"
   ```

### ⚠ App ở chế độ Development chỉ đăng nhập được bằng tài khoản đã thêm vào Roles

App mới tạo nằm ở chế độ **Development**. Ở chế độ này Facebook **chỉ cho phép**
các tài khoản có vai trò trong app đăng nhập:

- Vào **App roles → Roles** (hoặc **Roles → Roles** ở app cũ).
- Thêm tài khoản Facebook của bạn (và của người chấm đồ án, nếu cần) vào mục
  **Administrators**, **Developers** hoặc **Testers**.
- Người được thêm phải vào <https://developers.facebook.com/requests/> để bấm
  **chấp nhận** lời mời thì mới có hiệu lực.

Tài khoản ngoài danh sách sẽ nhận lỗi *"App not active"* hoặc
*"Ứng dụng này hiện không khả dụng"*. Muốn mở cho tất cả mọi người thì phải
chuyển app sang **Live** và gửi **App Review** cho quyền `email`.

### ⚠ Facebook có thể không trả về email

Đây là tình huống **thật và hay gặp**, không phải trường hợp hiếm:

- Tài khoản Facebook đăng ký bằng **số điện thoại**, chưa từng gắn email;
- Người dùng **bỏ tick** quyền email ở màn hình đồng ý;
- Email của tài khoản chưa được xác thực.

Khi đó backend từ chối tạo tài khoản và đưa người dùng về
`/dang-nhap?error=no_email`, kèm thông báo tiếng Việt gợi ý đăng ký bằng email
và mật khẩu. Đây là hành vi cố ý: hệ thống dùng email làm khoá duy nhất của
bảng `users`, không có email thì không ghép được đơn hàng, không gửi được thông
báo, và không có đường khôi phục tài khoản.

---

## 3. Điền `.env` và chạy

Trong `backend/.env` (copy từ `backend/.env.example` nếu chưa có):

```
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."

FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:4000"
```

Cập nhật CSDL (thêm cột `google_id`, `facebook_id`, cho `password_hash` nhận
NULL) rồi khởi động lại backend:

```bash
cd backend && npm run db:push
```

`.env` chỉ được đọc lúc server khởi động — sửa xong phải **restart** `npm run dev`.

---

## 4. Tự kiểm tra

| Việc cần thử | Kết quả mong đợi |
| --- | --- |
| Bấm nút Google ở `/dang-nhap` | Sang màn hình chọn tài khoản Google |
| Chọn tài khoản chưa từng dùng | Về `/tai-khoan`, có toast chào mừng, mục Thông báo có tin "Chào mừng đến với Hoàng Nha" |
| Đăng xuất rồi bấm Google lại | Vào thẳng đúng tài khoản đó, **không** tạo user thứ hai |
| Dùng tài khoản Google trùng email với user đã đăng ký bằng mật khẩu | Vào đúng user cũ, giữ nguyên đơn hàng và địa chỉ |
| Bấm "Huỷ" ở màn hình đồng ý | Về `/dang-nhap` kèm toast đỏ "Bạn đã huỷ cấp quyền…" |
| Mở thẳng `/auth/callback` (không có `#token=`) | Hiện trạng thái lỗi kèm nút "Quay lại đăng nhập" |
| Sau khi đăng nhập xong, nhìn thanh địa chỉ | **Không** còn `#token=...` |
| Vào `/tai-khoan/mat-khau` bằng tài khoản Google | Tiêu đề là "Đặt mật khẩu", không có ô "mật khẩu hiện tại" |
| Đặt mật khẩu rồi đăng nhập lại bằng email + mật khẩu đó | Vào được bình thường |

Kiểm tra bằng `curl` (không cần trình duyệt) — phải thấy `Location:` trỏ sang
Google, kèm `state=`:

```bash
curl -i "http://localhost:4000/api/auth/oauth/google?redirect=/gio-hang"
```

---

## 5. Khi deploy lên hosting thật

1. **Đổi domain trong `.env`** của backend:

   ```
   FRONTEND_URL="https://hoangnha.vn"
   BACKEND_URL="https://api.hoangnha.vn"
   ```

   Nếu backend phục vụ luôn `frontend/dist` (một domain duy nhất) thì đặt cả hai
   bằng nhau.

2. **Thêm redirect URI của production** vào console của Google và Facebook —
   *thêm*, không xoá cái localhost, để vẫn dev được:

   ```
   https://api.hoangnha.vn/api/auth/oauth/google/callback
   https://api.hoangnha.vn/api/auth/oauth/facebook/callback
   ```

3. **Bắt buộc HTTPS.** Facebook từ chối redirect URI `http://` không phải
   localhost; Google cũng vậy. Ngoài ra JWT đi qua fragment của URL — chạy trên
   `http://` thì bất kỳ ai trên cùng mạng Wi-Fi cũng đọc được.

4. Google: chuyển **OAuth consent screen** từ *Testing* sang **In production**
   (bấm **Publish app**) thì mọi tài khoản Google mới đăng nhập được, không còn
   giới hạn danh sách test user.

5. Facebook: chuyển app sang **Live** ở đầu trang quản trị, và gửi
   **App Review** xin quyền `email` (quyền `public_profile` được cấp sẵn).

6. Đặt `NODE_ENV="production"` và một `JWT_SECRET` ngẫu nhiên đủ dài — `state`
   chống CSRF của luồng OAuth được ký bằng chính khoá này.

7. Khai báo `CORS_ORIGIN` nếu frontend nằm ở domain khác backend.
