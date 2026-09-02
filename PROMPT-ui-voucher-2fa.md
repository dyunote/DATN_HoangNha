# Prompt cho Claude Code — Hoàng Nha Fashion

> Dán nguyên phần dưới đây vào Claude Code (mở ở thư mục gốc `hoangnha/`).

---

Dự án: **Hoàng Nha Fashion** — React 19 + TypeScript + TailwindCSS v4 (frontend/) và Express + Prisma + MySQL + JWT (backend/). Đọc `README.md`, `docs/erd.md`, `backend/prisma/schema.prisma` và `backend/src/lib/orderStatus.ts` trước khi sửa bất cứ thứ gì.

**Quy tắc chung khi làm việc:**
- TypeScript strict, không dùng `any`; Tailwind cho toàn bộ style; comment bằng tiếng Việt.
- Hạn chế thêm thư viện ngoài — chỉ thêm nếu thật sự không tự viết được, và phải nói rõ lý do trước khi cài.
- Bám theo pattern có sẵn của dự án (axios services trong `frontend/src/api/`, context, route admin trong `backend/src/routes/admin*`). Không refactor lan man ngoài phạm vi 3 việc dưới đây.
- Mỗi phần: **báo cáo trước khi code** (liệt kê file sẽ sửa + cách làm), tôi duyệt rồi mới sửa. Sau khi sửa: chạy `npm run build` ở cả frontend và backend để chắc chắn không lỗi type.
- Giải thích ngắn gọn *tại sao* làm vậy, coi tôi là người đang học.

Làm lần lượt 3 phần, xong phần nào tổng kết phần đó.

---

## Phần 1 — Rà soát UI/UX cho chuẩn

Quét toàn bộ `frontend/src` (cả trang khách và 10 trang admin) và lập **báo cáo lỗi UI/UX** dưới dạng bảng: `Vị trí (file:dòng)` · `Vấn đề` · `Mức độ (nặng/vừa/nhẹ)` · `Cách sửa đề xuất`.

Những thứ bắt buộc phải kiểm:

1. **Trạng thái màn hình**: mọi trang/danh sách gọi API có đủ 4 trạng thái chưa — loading (skeleton, không phải chữ "Đang tải..."), empty (có hình + call-to-action), error (có nút thử lại), thành công. Chỉ ra chỗ nào thiếu.
2. **Phản hồi thao tác**: nút submit có `disabled` + spinner khi đang gửi không? Có chống double-click / double-submit (đặt hàng, thêm giỏ, lưu form admin) không?
3. **Form & validate**: thông báo lỗi hiển thị ngay dưới field hay chỉ toast? Có validate phía client trước khi gọi API không? Nội dung lỗi tiếng Việt rõ ràng chưa?
4. **Responsive**: kiểm ở 360px, 768px, 1440px. Bảng trong admin có tràn ngang không (cần `overflow-x-auto` hoặc chuyển sang card ở mobile)? Ảnh có `aspect-ratio` cố định để không nhảy layout (CLS) chưa?
5. **Accessibility cơ bản**: `alt` cho ảnh, `label`/`aria-label` cho input và icon-button, focus ring nhìn thấy được, thao tác được bằng bàn phím, modal có khóa focus + đóng bằng `Esc`, độ tương phản chữ/nền đạt WCAG AA (4.5:1).
6. **Nhất quán design system**: liệt kê các giá trị "chế" tay lặp lại (màu hex rời rạc, cỡ chữ, bo góc, khoảng cách, biến thể nút) và đề xuất gom về token Tailwind v4 (`@theme`) + component dùng chung. Kiểm cả dark mode nếu Theme context đang bật.
7. **Điều hướng & tiêu đề**: breadcrumb, `document.title` theo trang, trạng thái active của menu, hành vi cuộn lên đầu khi đổi route, trang 404.
8. **Luồng quan trọng**: đi thử end-to-end *giỏ hàng → thanh toán → đặt hàng* và *admin đăng nhập → sửa đơn*, ghi lại mọi chỗ gây bối rối (thiếu xác nhận, thiếu thông báo thành công, mất dữ liệu form khi lỗi...).

Sau khi có báo cáo: **sửa các lỗi mức nặng và vừa**, gom nhóm theo từng commit nhỏ. Lỗi nhẹ để danh sách cuối báo cáo cho tôi tự quyết.

---

## Phần 2 — Voucher: số lượng phát hành và giới hạn sử dụng

Hiện `schema.prisma` đã có `usageLimit` (mặc định 1000) và `usedCount`. Việc cần làm:

1. **Form admin tạo/sửa voucher** (`/admin/voucher`): thêm ô nhập **Số lượng phát hành** (`usageLimit`) và ô **Giới hạn mỗi khách** (`perUserLimit` — thêm cột mới vào `Voucher`, mặc định 1, `0` = không giới hạn). Validate: số nguyên ≥ 1, `usageLimit` không được nhỏ hơn `usedCount` hiện tại khi sửa.
2. **Hiển thị**: bảng voucher trong admin thêm cột "Đã dùng / Tổng" kèm thanh tiến độ; badge trạng thái `Còn hiệu lực` / `Hết lượt` / `Hết hạn` / `Chưa bắt đầu`.
3. **Backend chặn vượt lượt** — đây là phần quan trọng nhất:
   - `POST /api/vouchers/validate` và lúc đặt hàng `POST /api/orders` đều phải kiểm `usedCount < usageLimit`, còn trong khoảng `startDate..endDate`, và số đơn đã dùng mã này của user < `perUserLimit`.
   - Việc tăng `usedCount` phải nằm **trong cùng transaction** với việc tạo đơn, và dùng update có điều kiện kiểu `updateMany({ where: { id, usedCount: { lt: usageLimit } }, data: { usedCount: { increment: 1 } } })` rồi kiểm `count === 1`; nếu `0` thì rollback và báo "Mã đã hết lượt sử dụng". Giải thích cho tôi vì sao cách này chống được race condition khi 2 người bấm đặt hàng cùng lúc, còn cách "đọc rồi so sánh rồi ghi" thì không.
   - **Hủy đơn / hoàn tiền** thì phải trả lại lượt (`decrement`) — kiểm tra `orders/:id/cancel` và route hủy bên admin xem đã xử lý chưa.
4. **Phía khách**: ô nhập mã ở `/thanh-toan` và trang `/tai-khoan/voucher` hiển thị đúng lý do khi mã không dùng được (hết lượt / hết hạn / chưa đạt `minOrder` / đã dùng rồi), không gộp chung một câu "Mã không hợp lệ".
5. Viết migration Prisma cho cột mới và cập nhật `seed.ts` + `docs/erd.md`, `docs/hoangnha_fashion.sql` cho khớp.

---

## Phần 3 — Xác thực 2 bước khi admin cập nhật trạng thái giao hàng

Mục tiêu: tránh việc bấm nhầm làm đổi trạng thái đơn — nhất là các bước **không thể quay lui** trong máy trạng thái ở `backend/src/lib/orderStatus.ts` (`shipping → delivered`, `→ delivery_failed`, `→ cancelled`, `→ returned`) và cả `confirm-payment`.

Yêu cầu:

1. **Bước 1 — modal xác nhận có ngữ cảnh**: hiện mã đơn, trạng thái cũ → trạng thái mới, cảnh báo "không thể hoàn tác", và bắt buộc nhập lý do với `delivery_failed` / `cancelled` / `returned`. Nút xác nhận chỉ bật khi đã điền đủ.
2. **Bước 2 — xác thực lại danh tính admin**. Làm theo hướng OTP email, và nếu thấy phương án khác hợp lý hơn cho một đồ án sinh viên thì đề xuất trước khi code:
   - `POST /api/admin/orders/:id/status/challenge` → sinh mã 6 số, hash rồi lưu (kèm `expiresAt` 5 phút, `attempts`), gửi tới email admin đang đăng nhập; trả về `challengeId`.
   - `POST /api/admin/orders/:id/status` nhận thêm `challengeId` + `otp`; server kiểm hash, hạn dùng, số lần sai (quá 5 lần thì hủy challenge), khớp đúng `orderId` + trạng thái đích đã yêu cầu ở bước challenge, và **xóa challenge sau khi dùng** (one-time).
   - Rate limit: tối đa 3 lần gửi OTP / 10 phút / admin.
   - Cho phép cấu hình bằng env `ADMIN_2FA_ORDER_STATUS=true|false` để lúc dev/demo có thể tắt; mặc định `true` khi `NODE_ENV=production`. Nếu chưa cấu hình SMTP thì log OTP ra console ở môi trường dev, tuyệt đối không trả OTP về response.
3. **Không tin frontend**: mọi kiểm tra (quyền admin, tính hợp lệ của bước chuyển trạng thái, OTP) đều phải nằm ở backend. Modal chỉ là lớp UX.
4. **Ghi vết**: lưu ai đổi, từ trạng thái nào sang trạng thái nào, lúc nào, lý do — dùng bảng có sẵn nếu hợp, nếu phải thêm bảng mới thì nói rõ vì ERD đang chốt 13 bảng.
5. **UI**: ô nhập OTP 6 số (tự chuyển ô, dán được cả mã), đếm ngược thời gian còn hiệu lực, nút "Gửi lại mã" bị khóa 60 giây, thông báo lỗi rõ ràng ("Mã sai", "Mã hết hạn", "Sai quá số lần cho phép").
6. Cập nhật `README.md`: env mới, luồng 2 bước, và cách tắt khi chạy demo.

---

**Cuối cùng**: tổng kết những gì đã sửa, những gì cố ý bỏ qua và vì sao, kèm danh sách việc tôi cần tự làm (chạy migration, cấu hình SMTP...).
