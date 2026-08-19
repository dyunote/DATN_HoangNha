# Hoàng Nha Fashion — Website bán quần áo cao cấp

Full-stack e-commerce: **React 19 + TypeScript + TailwindCSS v4** (frontend) · **Express + Prisma + MySQL (XAMPP) + JWT** (backend).

## Cấu trúc dự án

```
hoangnha/
├── package.json           # Scripts điều phối chung (dev, server, db:reset...)
├── docs/
│   ├── erd.md                 # ERD (Mermaid) + ghi chú thiết kế CSDL — 13 bảng
│   ├── ERD-HoangNha.drawio    # Sơ đồ ERD (sinh bằng prisma-to-drawio.py)
│   ├── UseCase-HoangNha.drawio# Sơ đồ use case
│   ├── hoangnha.dbml          # ERD cho dbdiagram.io (prisma-to-dbml.py)
│   └── hoangnha_fashion.sql   # Toàn bộ CSDL + dữ liệu mẫu, import thẳng vào MySQL
├── frontend/              # FRONTEND (React 19 + Vite + TailwindCSS v4)
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── api/           # Lớp gọi API (axios client + services)
│       ├── components/    # UI, layout, product, home sections, auth
│       ├── context/       # Theme, Cart, Wishlist, Toast, Auth
│       ├── hooks/         # useProducts (API + fallback), useCountUp...
│       ├── pages/         # Trang chủ, Shop, Chi tiết SP, Giỏ, Checkout,
│       │                  # Auth, Tài khoản (8 trang), Admin (10 trang), 404
│       ├── data/          # Mock data (fallback khi backend tắt)
│       └── types/
└── backend/               # BACKEND (Express + Prisma + MySQL)
    ├── package.json
    ├── .env               # DATABASE_URL, JWT_SECRET, PORT
    ├── prisma/
    │   ├── schema.prisma  # Schema 13 bảng, ánh xạ 1-1 với ERD
    │   └── seed.ts        # Seed 24 sản phẩm, 6 danh mục, users, vouchers...
    └── src/
        ├── index.ts       # Express app
        ├── lib/           # prisma client, JWT middleware
        └── routes/        # auth, products, catalog, orders, me, admin
```

## Chạy dự án

### 1. Database — MySQL trên XAMPP

1. Mở **XAMPP Control Panel** → Start **MySQL** (hoặc chạy `C:\xampp\mysql_start.bat`).
2. Database `hoangnha_fashion` (utf8mb4, 13 bảng) sẽ được dùng — tạo tự động bằng lệnh:
   ```bash
   C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS hoangnha_fashion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```
3. Kết nối cấu hình trong `backend/.env`: `mysql://root:@localhost:3306/hoangnha_fashion` (XAMPP mặc định root không mật khẩu).
4. Xem dữ liệu trực quan tại **phpMyAdmin**: http://localhost/phpmyadmin → chọn `hoangnha_fashion`.

> **Cách nhanh hơn:** import `docs/hoangnha_fashion.sql` qua phpMyAdmin (tab **Import**)
> — file này tự tạo database, 13 bảng và toàn bộ dữ liệu mẫu, khỏi cần `db:push` + `db:seed`.

### 2. Backend (cổng 4000)

```bash
cd backend
npm install
npx prisma generate  # sinh Prisma Client theo schema (bắt buộc sau khi đổi schema)
npm run db:push      # tạo 13 bảng trong MySQL — BỎ QUA nếu đã import file .sql
npm run db:seed      # seed dữ liệu mẫu   — BỎ QUA nếu đã import file .sql
npm run dev          # http://localhost:4000/api
```

### 3. Frontend (cổng 5173)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

> **Hoặc chạy từ thư mục gốc** (không cần `cd`): `npm run server` (backend) và `npm run dev` (frontend). Cài đặt lần đầu: `npm run install:all`.

> Frontend **tự fallback sang mock data** khi backend chưa chạy — giao diện luôn hoạt động.

## Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@hoangnha.vn` | `admin1234` |
| Khách hàng | `duytran.220218@gmail.com` | `12345678` |

## API chính

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/auth/register` · `/login` | Đăng ký / đăng nhập (JWT) | — |
| POST | `/api/auth/forgot-password` · `/verify-otp` · `/reset-password` | Quên mật khẩu: gửi OTP qua email → xác thực → đặt lại | — |
| GET/PUT | `/api/auth/me` · `/me/password` | Phiên hiện tại, sửa hồ sơ, đổi mật khẩu | ✓ |
| GET | `/api/products` | Lọc `category, q, sale, sort, page, maxPrice, minRating, brand` | — |
| GET | `/api/products/:id` (+`/reviews`) | Chi tiết + đánh giá đã duyệt | — |
| GET | `/api/categories` · `/banners` · `/vouchers` · `/reviews` | Dữ liệu công khai cho trang chủ | — |
| POST | `/api/vouchers/validate` | Kiểm tra mã giảm giá | — |
| POST | `/api/orders` | Đặt hàng (trừ kho, áp voucher, transaction) | ✓ |
| GET/PATCH | `/api/orders` · `/:id` · `/:id/cancel` | Đơn của tôi / chi tiết / hủy đơn | ✓ |
| CRUD | `/api/me/addresses` · `/cart` · `/notifications` · `/reviews` | Hồ sơ cá nhân | ✓ |
| POST | `/api/sepay/webhook` | SePay gọi khi có tiền vào (xác thực API Key) | API Key |
| GET | `/api/sepay/orders/:id/payment-status` | Frontend poll trạng thái thanh toán | ✓ |
| POST | `/api/sepay/simulate/:id` · `/api/payments/:orderId/confirm` | Giả lập chuyển khoản (chỉ khi `SEPAY_ALLOW_SIMULATE=true`) | ✓ |
| CRUD | `/api/admin/*` — stats, orders (+`/:id/status`, `/:id/confirm-payment`), products (+`/:id/variants`), variants, categories, customers, vouchers, banners, reviews (+approve, reply), upload | Quản trị | Admin |

> Wishlist, điểm thưởng, đổi/trả, bộ sưu tập, tạp chí **không có** trong bản này —
> đã lược bỏ khi rút gọn CSDL xuống 13 bảng (xem `docs/erd.md`).

## Đổi lại SQLite (không cần XAMPP)

Sửa `backend/prisma/schema.prisma`: `provider = "sqlite"` và `backend/.env`:
`DATABASE_URL="file:./dev.db"`, rồi chạy lại `npm run db:push && npm run db:seed`.

## Routes frontend

- `/` trang chủ · `/danh-muc` shop · `/san-pham/:id` chi tiết · `/gio-hang` · `/thanh-toan`
- `/dang-nhap` · `/dang-ky` · `/quen-mat-khau`
- `/tai-khoan/*` hồ sơ (tổng quan, thông tin, mật khẩu, địa chỉ, đơn hàng, yêu thích, voucher, thông báo)
  — *yêu thích lưu ở `localStorage`, không có bảng trong CSDL*
- `/admin/*` quản trị (dashboard, sản phẩm, danh mục, đơn hàng, khách hàng, voucher, banner, đánh giá, thống kê, cài đặt)
