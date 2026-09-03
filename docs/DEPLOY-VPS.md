# Đưa Hoàng Nha lên VPS iNET (Ubuntu 24.04)

Thông tin của bạn:

| Mục | Giá trị |
|---|---|
| IP VPS | `103.72.98.210` |
| Hệ điều hành | Ubuntu 24.04 LTS |
| Cấu hình | 1 CPU · 2GB RAM · 20GB SSD |
| Tên miền | `hoangnha.io.vn` |
| Repo | `https://github.com/dyunote/DATN_HoangNha.git` |

**Kiến trúc sau khi deploy:**

```
Internet → Nginx (cổng 80/443, có SSL)
              ↓ reverse proxy
           Node/Express (cổng 4000, chạy nền bằng PM2)
              ↓ phục vụ frontend/dist  +  /api
           MySQL (cổng 3306, chỉ localhost)
```

Backend tự phục vụ luôn `frontend/dist`, nên **web và API chung một tên miền** — không dính CORS, không cần `VITE_API_URL`.

---

## Bước 0 — Chuẩn bị ở máy Windows

### 0.1. Đẩy code mới nhất lên GitHub

Mở PowerShell tại `D:\hoangnha`:

```powershell
git status                       # xem còn gì chưa commit
git add -A
git commit -m "chuan bi deploy len VPS"
git push origin main             # hoặc branch bạn đang dùng
```

> Nếu bạn đang ở branch khác (`feature/hoan-thien-do-an`...), nhớ merge vào `main` trước, hoặc lát nữa clone đúng branch đó trên VPS.

### 0.2. Kiểm tra file .env KHÔNG bị commit

`.gitignore` đã có `.env` và `.env.*` rồi, chuẩn. Nghĩa là trên VPS bạn sẽ **tự tạo lại `backend/.env`** — đây là điều đúng, secret không bao giờ nên nằm trong Git.

Chạy lệnh này để chắc chắn:

```powershell
git ls-files | Select-String "\.env$"
```

Không ra gì = an toàn. Nếu ra `backend/.env` thì phải gỡ ngay:

```powershell
git rm --cached backend/.env
git commit -m "go .env khoi git"
git push
```

### 0.3. Sinh sẵn JWT_SECRET

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy chuỗi 96 ký tự ra Notepad, lát nữa dán vào `.env` trên VPS.

---

## Bước 1 — Trỏ tên miền về VPS (làm ngay, DNS cần thời gian lan truyền)

1. Vào https://portal.inet.vn → **Tên miền** → `hoangnha.io.vn` → nút **Bản ghi** (như trong ảnh bạn gửi).
2. Thêm/sửa 2 bản ghi:

| Loại | Tên (Host) | Giá trị | TTL |
|---|---|---|---|
| A | `@` | `103.72.98.210` | 300 |
| A | `www` | `103.72.98.210` | 300 |

3. **Xóa** các bản ghi A/CNAME cũ trỏ đi chỗ khác (parking page của iNET) nếu có — nếu không sẽ xung đột.

Kiểm tra từ máy Windows (chờ 5–30 phút):

```powershell
nslookup hoangnha.io.vn 8.8.8.8
```

Ra `103.72.98.210` là xong. DNS chưa kịp thì cứ làm tiếp các bước dưới, chỉ bước cài SSL mới bắt buộc DNS phải xong.

---

## Bước 2 — SSH vào VPS lần đầu

### 2.1. Lấy mật khẩu root

Vào OnePortal → **Cloud Server** → nút **OneDash** → chọn máy `CS-Linux-...`. Trong đó có mật khẩu root (hoặc mục "Đổi mật khẩu" để tự đặt lại). Ghi ra Notepad.

### 2.2. Kết nối

Windows 10/11 có sẵn SSH. Mở **PowerShell**:

```powershell
ssh root@103.72.98.210
```

- Lần đầu nó hỏi `Are you sure you want to continue connecting (yes/no)?` → gõ `yes` + Enter.
- Rồi nhập mật khẩu. **Lưu ý: gõ mật khẩu sẽ KHÔNG hiện ký tự nào cả**, kể cả dấu sao. Cứ gõ (hoặc chuột phải để dán) rồi Enter.

Thành công thì dấu nhắc đổi thành `root@...:~#`. Từ giờ mọi lệnh trong hướng dẫn này gõ **trong cửa sổ SSH đó**.

> **Giải thích:** SSH là giao thức cho phép bạn điều khiển một máy Linux từ xa qua dòng lệnh. Bạn đang ngồi ở Windows nhưng mọi lệnh gõ vào sẽ chạy trên con VPS ở data center.

### 2.3. Cập nhật hệ thống + tạo user thường

Chạy root cho mọi thứ là thói quen xấu — lỡ tay một lệnh là hỏng máy. Tạo user riêng:

```bash
apt update && apt upgrade -y

# tạo user tên "deploy"
adduser deploy                    # nó hỏi mật khẩu, các mục Full Name... cứ Enter bỏ qua
usermod -aG sudo deploy           # cho phép dùng sudo
```

Đăng nhập lại bằng user mới (mở PowerShell mới, hoặc gõ `exit` rồi):

```powershell
ssh deploy@103.72.98.210
```

Từ đây các lệnh cần quyền cao sẽ có tiền tố `sudo`.

### 2.4. (Nên làm) Đăng nhập bằng SSH key thay mật khẩu

Ở **PowerShell trên Windows** (không phải trong SSH):

```powershell
ssh-keygen -t ed25519 -C "duytran.220218@gmail.com"
# Enter 3 lần (chấp nhận đường dẫn mặc định, không cần passphrase)

# Đẩy public key lên VPS
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh deploy@103.72.98.210 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Giờ `ssh deploy@103.72.98.210` vào thẳng, không hỏi mật khẩu nữa.

---

## Bước 3 — Cài môi trường trên VPS

### 3.1. Node.js 22 (project yêu cầu ≥ 20.12)

Không dùng `apt install nodejs` — bản trong kho Ubuntu quá cũ. Dùng NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

node -v     # phải ra v22.x
npm -v
```

### 3.2. MySQL 8

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation
```

`mysql_secure_installation` sẽ hỏi lần lượt:

| Câu hỏi | Trả lời |
|---|---|
| Setup VALIDATE PASSWORD component? | `n` (đơn giản cho đồ án) |
| New password for root | đặt mật khẩu root MySQL, ghi ra Notepad |
| Remove anonymous users? | `y` |
| Disallow root login remotely? | `y` |
| Remove test database? | `y` |
| Reload privilege tables? | `y` |

### 3.3. Tạo database + user riêng cho app

```bash
sudo mysql
```

Trong dấu nhắc `mysql>`, dán từng dòng (nhớ **đổi `MatKhauManhCuaBan`** thành mật khẩu bạn tự đặt):

```sql
CREATE DATABASE hoangnha_fashion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hoangnha'@'localhost' IDENTIFIED BY 'MatKhauManhCuaBan';
GRANT ALL PRIVILEGES ON hoangnha_fashion.* TO 'hoangnha'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **Tại sao không dùng root?** Nếu app bị khai thác lỗ hổng SQL, kẻ tấn công chỉ chạm được đúng database này, không phá được cả server MySQL. Nguyên tắc least privilege.

### 3.4. Git + PM2 + Nginx

```bash
sudo apt install -y git nginx
sudo npm install -g pm2
```

- **PM2**: trình quản lý tiến trình Node. Nó giữ app chạy nền, tự khởi động lại khi app crash hoặc khi VPS reboot. Không có PM2 thì đóng SSH là app tắt.
- **Nginx**: web server đứng trước, nhận request ở cổng 80/443 rồi chuyển tiếp vào Node ở cổng 4000. Nó cũng là chỗ gắn SSL.

---

## Bước 4 — Lấy code về VPS

```bash
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
cd /var/www

git clone https://github.com/dyunote/DATN_HoangNha.git hoangnha
cd hoangnha
```

Repo **private** thì GitHub sẽ hỏi user/password — password thường không dùng được nữa, cần Personal Access Token. Cách gọn hơn là dùng SSH key của VPS:

```bash
ssh-keygen -t ed25519 -C "vps-hoangnha"     # Enter 3 lần
cat ~/.ssh/id_ed25519.pub                    # copy toàn bộ dòng ssh-ed25519 AAAA...
```

Dán key đó vào GitHub → **Settings → SSH and GPG keys → New SSH key**. Rồi clone bằng đường dẫn SSH:

```bash
git clone git@github.com:dyunote/DATN_HoangNha.git hoangnha
```

Nếu code nằm ở branch khác `main`:

```bash
cd /var/www/hoangnha
git checkout feature/hoan-thien-do-an
```

---

## Bước 5 — Import cơ sở dữ liệu

Bạn có sẵn `deploy/hoangnha_fashion.sql` ở máy Windows, nhưng thư mục `deploy/` **nằm trong .gitignore** nên nó không lên GitHub. Có 2 cách:

### Cách A — Dùng file .sql (nhanh, có sẵn dữ liệu mẫu)

Ở **PowerShell trên Windows**:

```powershell
scp D:\hoangnha\deploy\hoangnha_fashion.sql deploy@103.72.98.210:/tmp/
```

Rồi trong SSH:

```bash
mysql -u hoangnha -p hoangnha_fashion < /tmp/hoangnha_fashion.sql
# nhập mật khẩu MySQL của user hoangnha
```

> File .sql của bạn có thể chứa lệnh `CREATE DATABASE`/`USE`. Nếu import báo lỗi quyền, chạy bằng root: `sudo mysql < /tmp/hoangnha_fashion.sql`, rồi cấp lại quyền cho user `hoangnha` như ở bước 3.3.

### Cách B — Dùng Prisma (làm sau bước 6, khi đã `npm install`)

```bash
cd /var/www/hoangnha
npm --prefix backend run db:deploy    # prisma db push, tạo 13 bảng
npm --prefix backend run db:seed      # seed dữ liệu mẫu — CHỈ CHẠY MỘT LẦN
```

Kiểm tra:

```bash
mysql -u hoangnha -p -e "USE hoangnha_fashion; SHOW TABLES;"
```

Phải ra 13 bảng.

---

## Bước 6 — Tạo file .env trên VPS

```bash
cd /var/www/hoangnha/backend
cp .env.example .env
nano .env
```

`nano` là trình soạn thảo trong terminal. Di chuyển bằng phím mũi tên, sửa xong nhấn **Ctrl+O → Enter** (lưu) rồi **Ctrl+X** (thoát).

Sửa thành:

```ini
NODE_ENV="production"
PORT=4000

DATABASE_URL="mysql://hoangnha:MatKhauManhCuaBan@localhost:3306/hoangnha_fashion"

JWT_SECRET="<dán chuỗi 96 ký tự đã sinh ở bước 0.3>"

# Để trống vì backend phục vụ luôn frontend/dist — cùng một tên miền, không cần CORS
CORS_ORIGIN=""

# SePay — điền khi đã đăng ký, chưa có thì để trống
SEPAY_ACCOUNT=""
SEPAY_BANK="MBBank"
SEPAY_API_KEY=""
SEPAY_EXPIRE_MINUTES=15

# BẮT BUỘC false trên server thật
SEPAY_ALLOW_SIMULATE="false"

ANTHROPIC_API_KEY=""
```

Khóa quyền file lại (chỉ chủ sở hữu đọc được — trong này có mật khẩu DB và JWT secret):

```bash
chmod 600 .env
```

> **Ba thứ tuyệt đối không được sai:**
> 1. `NODE_ENV=production` — thiếu thì server để lộ chi tiết lỗi ra ngoài.
> 2. `JWT_SECRET` phải là chuỗi ngẫu nhiên dài. Đoán được secret = giả mạo được token admin.
> 3. `SEPAY_ALLOW_SIMULATE=false` — để `true` thì ai cũng bấm "tôi đã chuyển khoản" và đơn thành đã thanh toán mà không có tiền thật.

---

## Bước 7 — Build và chạy thử

```bash
cd /var/www/hoangnha
npm run build:all
```

Lệnh này chạy: `npm ci` ở frontend → `vite build` (ra `frontend/dist`) → `npm ci` ở backend (postinstall tự `prisma generate`).

> **VPS 2GB RAM có thể bị kill khi Vite build** (báo `Killed` hoặc `JavaScript heap out of memory`). Nếu gặp, tạo swap 2GB rồi build lại:
> ```bash
> sudo fallocate -l 2G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> free -h        # kiểm tra: dòng Swap phải có 2.0Gi
> ```

Chạy thử trước khi giao cho PM2:

```bash
npm start
```

Thấy log server listening ở cổng 4000 là ổn. Mở **PowerShell mới** (giữ nguyên cửa sổ SSH kia) và test:

```powershell
curl http://103.72.98.210:4000/api/products
```

Chưa ra gì vì tường lửa chặn cổng 4000 — bình thường và đúng ý ta (chỉ Nginx được ra ngoài). Test ngay trên VPS thay thế: quay lại SSH, nhấn **Ctrl+C** để dừng, rồi:

```bash
npm start &                       # chạy nền tạm
sleep 5
curl -s http://localhost:4000/api/products | head -c 300
kill %1                           # tắt tiến trình tạm
```

Ra JSON sản phẩm = backend + database đã thông.

---

## Bước 8 — Chạy nền bằng PM2

```bash
cd /var/www/hoangnha
pm2 start npm --name hoangnha -- start

pm2 status                        # xem trạng thái, phải là "online"
pm2 logs hoangnha --lines 50      # xem log, Ctrl+C để thoát
```

Cho tự khởi động khi VPS reboot:

```bash
pm2 save
pm2 startup
```

`pm2 startup` in ra **một lệnh `sudo env PATH=...`** — copy đúng lệnh đó, dán chạy lại. Sau đó `pm2 save` một lần nữa.

Lệnh PM2 hay dùng về sau:

```bash
pm2 restart hoangnha    # khởi động lại sau khi đổi code/.env
pm2 stop hoangnha
pm2 logs hoangnha       # xem log realtime
pm2 monit               # xem CPU/RAM
```

---

## Bước 9 — Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/hoangnha
```

Dán vào:

```nginx
server {
    listen 80;
    server_name hoangnha.io.vn www.hoangnha.io.vn;

    # Cho phép upload ảnh sản phẩm lớn (mặc định Nginx chỉ 1MB)
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt:

```bash
sudo ln -s /etc/nginx/sites-available/hoangnha /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default    # bỏ trang mặc định "Welcome to nginx"
sudo nginx -t                                   # kiểm tra cú pháp — phải ra "syntax is ok"
sudo systemctl reload nginx
```

### Mở tường lửa

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'     # mở cổng 80 và 443
sudo ufw enable                 # gõ y
sudo ufw status
```

> ⚠️ Nhớ `allow OpenSSH` **trước** khi `enable`, không thì bạn tự khóa mình ra ngoài, phải vào console của iNET để cứu.

Cổng 4000 và 3306 **không mở** — đúng như vậy. Node chỉ nhận request từ Nginx qua localhost, MySQL chỉ nhận từ chính máy đó.

Giờ mở trình duyệt: **http://hoangnha.io.vn** — web phải lên rồi (nếu DNS đã lan truyền xong).

---

## Bước 10 — Cài SSL miễn phí (HTTPS)

DNS phải trỏ đúng trước, nếu không Let's Encrypt không xác minh được.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d hoangnha.io.vn -d www.hoangnha.io.vn
```

Certbot sẽ hỏi:

- Email: `duytran.220218@gmail.com` (để nhận cảnh báo hết hạn)
- Đồng ý điều khoản: `Y`
- Nhận email marketing từ EFF: `N`
- Redirect HTTP → HTTPS: chọn **2** (redirect)

Certbot tự sửa file Nginx thêm phần SSL. Chứng chỉ hạn 90 ngày nhưng tự gia hạn — kiểm tra:

```bash
sudo certbot renew --dry-run
systemctl status certbot.timer
```

Xong: **https://hoangnha.io.vn** 🔒

---

## Bước 11 — Kiểm tra lần cuối

| Kiểm tra | Cách làm | Kết quả đúng |
|---|---|---|
| Trang chủ | Mở `https://hoangnha.io.vn` | Hiện giao diện, có sản phẩm |
| API | `https://hoangnha.io.vn/api/products` | Trả JSON |
| Đăng nhập admin | `/dang-nhap` với `admin@hoangnha.vn` / `admin1234` | Vào được `/admin` |
| Upload ảnh | Admin → Sản phẩm → thêm ảnh | Ảnh hiện, không lỗi 413 |
| Refresh trang con | Vào `/danh-muc` rồi F5 | Không ra 404 (SPA fallback) |
| Reboot | `sudo reboot`, chờ 1 phút rồi mở lại web | Web tự lên nhờ PM2 |

**Sau khi kiểm tra xong, đổi ngay mật khẩu admin mặc định.** `admin1234` nằm trong README công khai trên GitHub.

---

## Cập nhật code về sau

Mỗi lần sửa code ở máy và muốn đẩy lên:

```bash
ssh deploy@103.72.98.210
cd /var/www/hoangnha
git pull
npm run build:all
npm run db:push          # đồng bộ cấu trúc bảng với prisma/schema.prisma
pm2 restart hoangnha
```

> **Vì sao lần nào cũng chạy `db:push`.** Nó *idempotent*: schema khớp CSDL rồi thì
> chỉ in "already in sync" và thoát, không đụng gì. Nhưng bỏ nó đi thì lần nào có
> sửa `schema.prisma` là web gãy ngay sau khi deploy — code mới hỏi cột chưa tồn
> tại, MySQL trả "Unknown column", và **mọi** truy vấn chạm bảng đó đều hỏng chứ
> không riêng tính năng mới. Chạy mặc định thì không bao giờ quên.
>
> Dùng `db:push` chứ đừng dùng `db:deploy` ở đây: `db:deploy` là
> `prisma db push --accept-data-loss`, nó nuốt luôn cảnh báo mất dữ liệu. Với
> `set -e` trong script, `db:push` gặp thay đổi nguy hiểm sẽ dừng cả lượt deploy —
> đó chính là hành vi mình muốn trên server thật.

Gọn hơn thì tạo script một lần:

```bash
nano ~/deploy.sh
```

```bash
#!/bin/bash
set -e
cd /var/www/hoangnha
# Sao lưu trước khi đụng vào CSDL — mất 1 giây, cứu được cả buổi
mysqldump -u hoangnha -p"$DB_PASS" hoangnha_fashion > ~/backup-truoc-deploy.sql
git pull
npm run build:all
npm run db:push
pm2 restart hoangnha
echo "Deploy xong: $(date)"
```

> Đặt `DB_PASS` một lần trong `~/.bashrc` (`export DB_PASS='MatKhauManhCuaBan'`)
> rồi `chmod 600 ~/.bashrc`, để mật khẩu không nằm trong script. Không muốn tự
> động backup thì xoá dòng `mysqldump`, nhưng nhớ backup tay trước mỗi lần đổi
> `schema.prisma`.

```bash
chmod +x ~/deploy.sh
```

Từ đó về sau chỉ cần: `~/deploy.sh`

---

## Vấn đề hay gặp

| Triệu chứng | Nguyên nhân & cách xử lý |
|---|---|
| **Toast đỏ "Bảng/cột chưa tồn tại. Chạy: npx prisma db push"** | Đã deploy code mới nhưng quên đồng bộ CSDL, nên bảng vẫn thiếu cột mà code mới cần. Sửa: `cd /var/www/hoangnha && npm run db:push && pm2 restart hoangnha`. Backup trước bằng `mysqldump` nếu là lần đầu đổi schema. Triệu chứng dễ nhầm: **đăng nhập email/mật khẩu cũng hỏng** chứ không riêng tính năng mới, vì mọi truy vấn chạm bảng đó đều gãy. |
| **502 Bad Gateway** | Node không chạy. `pm2 status` → nếu `errored`, xem `pm2 logs hoangnha --err --lines 100`. Thường do sai `DATABASE_URL` hoặc thiếu `JWT_SECRET`. |
| **Build bị `Killed`** | Hết RAM. Tạo swap (bước 7). |
| **Trang chủ trắng, API vẫn OK** | Chưa build frontend, hoặc `frontend/dist` không tồn tại. Chạy lại `npm --prefix frontend run build` rồi `pm2 restart hoangnha`. |
| **Vào `/danh-muc` rồi F5 ra 404** | SPA fallback hỏng — Nginx phải proxy *tất cả* về Node, không được có `try_files` riêng cho `/`. |
| **Upload ảnh lỗi 413** | Thiếu `client_max_body_size 20M;` trong Nginx. |
| **`ER_ACCESS_DENIED` trong log PM2** | Sai user/mật khẩu trong `DATABASE_URL`. Test: `mysql -u hoangnha -p hoangnha_fashion`. |
| **Certbot báo `Timeout during connect`** | DNS chưa trỏ xong hoặc UFW chưa mở 80. Kiểm tra `nslookup hoangnha.io.vn 8.8.8.8` và `sudo ufw status`. |
| **Ảnh admin upload mất sau deploy** | Không mất trên VPS (khác Render/Railway) vì `backend/uploads/` nằm trên đĩa thật. Chỉ cần đừng `git clean -fdx`. Nên backup thư mục này. |

## Backup nên làm hằng tuần

```bash
mysqldump -u hoangnha -p hoangnha_fashion > ~/backup-$(date +%F).sql
tar -czf ~/uploads-$(date +%F).tar.gz -C /var/www/hoangnha/backend uploads
```

Tải về máy Windows:

```powershell
scp deploy@103.72.98.210:~/backup-*.sql D:\hoangnha\backups\
```

---

## Nhắc về SePay

VPS đã có tên miền HTTPS thật nên không cần ngrok nữa:

1. Vào https://my.sepay.vn → **Webhooks** → Thêm webhook
2. URL: `https://hoangnha.io.vn/api/sepay/webhook`
3. Sự kiện: **Có tiền vào**
4. Bảo mật: **API Key** → sinh chuỗi ngẫu nhiên, dán vào `SEPAY_API_KEY` trong `.env` trên VPS
5. `pm2 restart hoangnha`
