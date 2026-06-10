# 🛍️ Hoàng Nha — Website Bán Quần Áo (Full-stack TypeScript)

Đồ án tốt nghiệp: hệ thống thương mại điện tử bán quần áo, xây dựng full-stack bằng **TypeScript**. Khách hàng xem – mua – thanh toán – theo dõi đơn; admin quản lý sản phẩm, đơn hàng, người dùng và xem thống kê.

> Repo: https://github.com/dyunote/DATN_HoangNha

---

## 🧰 Công nghệ

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend   | React 19 + Vite + TypeScript, React Router, Axios, Context API, TailwindCSS |
| Backend    | Node.js + Express + TypeScript (routes → controllers → services → models) |
| Database   | MySQL (mysql2), chạy bằng XAMPP |
| Auth       | JWT + bcrypt, phân quyền theo role |
| Thanh toán | COD / Chuyển khoản (mã QR VietQR) / Ví điện tử |

## ✨ Tính năng chính

**Khách hàng**

- Xem & lọc/sắp xếp/tìm kiếm sản phẩm (không cần đăng nhập)
- Chi tiết sản phẩm: nhiều ảnh, chọn size/màu/số lượng
- Giỏ hàng, áp voucher, giảm giá theo hạng thành viên
- Đặt hàng, theo dõi trạng thái đơn, lịch sử mua
- **Thanh toán chuyển khoản hiển thị mã QR** (quét bằng app ngân hàng, tự điền số tiền + nội dung)
- Đánh giá sản phẩm (1–5 sao, bình luận, ảnh)

**Admin** (`/admin`)

- Quản lý sản phẩm: thêm/sửa/ẩn/xóa — ghi thẳng vào MySQL, danh sách cập nhật ngay
- Quản lý danh mục, đơn hàng (cập nhật trạng thái), voucher, người dùng (khóa/mở)
- Thống kê: doanh thu, đơn theo trạng thái, top sản phẩm bán chạy (biểu đồ)

---

## 🚀 Hướng dẫn chạy

### 1. Yêu cầu
- Node.js >= 18
- XAMPP (hoặc MySQL >= 8)

### 2. Tạo database bằng XAMPP
1. Mở **XAMPP Control Panel** → Start **Apache** và **MySQL**.
2. Vào `http://localhost/phpmyadmin` → tab **Import** → chọn `backend/database/schema.sql` → Go.
3. Import tiếp `backend/database/seed.sql` để có dữ liệu mẫu.

### 3. Chạy Backend
```bash
cd backend
cp .env.example .env      # rồi sửa DB_PASSWORD (XAMPP mặc định để trống)
npm install
npm run dev               # http://localhost:5000
```

### 4. Chạy Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### 5. Cấu hình ngân hàng cho mã QR
Mở `frontend/src/config/bank.ts` và sửa thành tài khoản thật của bạn:
```ts
bankCode: 'vietcombank',       // mã ngân hàng VietQR
accountNo: '1234567890',       // số tài khoản
accountName: 'HOANG NHA SHOP', // tên chủ TK (IN HOA, không dấu)
```

---

## 🔑 Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | `admin@hoangnha.com` | `admin123` |
| Khách | `khach1@gmail.com` (và khach2, khach3) | `user123` |

---

## 📁 Cấu trúc thư mục

```
backend/
  src/
    config/        # kết nối MySQL
    routes/        # định tuyến API
    controllers/   # xử lý request/response
    services/      # business logic
    models/        # truy vấn MySQL
    middlewares/   # auth, error handling
    utils/         # jwt, response, pricing
    types/         # kiểu dữ liệu dùng chung
  database/        # schema.sql, seed.sql
frontend/
  src/
    api/           # axios instance
    config/        # bank.ts (cấu hình QR)
    context/       # AuthContext, CartContext
    layouts/       # MainLayout, AdminLayout
    components/     # Header, Footer, ProductCard...
    pages/         # trang khách
    pages/admin/   # trang quản trị
```

## 📝 Ghi chú nghiệp vụ

- Giảm giá theo hạng thành viên: normal 0%, silver 2%, gold 5%, vip 10%.
- Voucher giảm theo % hoặc số tiền cố định, có thời hạn & số lượng.
- Đặt hàng: trừ tồn kho biến thể, tăng `sold_count`.
- Admin cập nhật đơn `delivered` → thanh toán tự chuyển `paid`.
- Chỉ đánh giá được sản phẩm đã mua và đơn đã `delivered`.
