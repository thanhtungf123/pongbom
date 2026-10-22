# Hướng dẫn Deploy PongBom lên VPS

Runbook deploy thực tế cho **pongbom** (Next.js 15 + MongoDB Atlas + Cloudinary),
chạy sau Nginx + Cloudflare, cấp SSL bằng Let's Encrypt.

- **Domain:** `trochoi2nguoi.org`
- **Repo:** https://github.com/thanhtungf123/pongbom.git
- **VPS:** Ubuntu 22.04 (`141.193.23.130`), thư mục `/var/www/pongbom`
- **Cổng app:** **3005** (vì 3000–3002 đã bị các app khác trên VPS chiếm)
- **Process manager:** PM2 (tên process: `pongbom`)

> VPS này chạy nhiều app cùng lúc (dino, snake, wf…). Mỗi app một cổng + một
> domain riêng trong Nginx, nên không đụng nhau.

---

## 1. Yêu cầu môi trường (cài 1 lần)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git nginx certbot python3-certbot-nginx
npm install -g pm2
```

Kiểm tra nhanh toàn bộ:
```bash
node -v && npm -v && git --version && pm2 -v && nginx -v && certbot --version
```
(Node phải >= 20.)

---

## 2. Biến môi trường `.env.local`

File `.env.local` KHÔNG commit lên git (đã nằm trong `.gitignore`). Tạo thủ công
trên VPS **trước khi build** (các biến `NEXT_PUBLIC_*` được nhúng vào bundle lúc
build — đổi là phải build lại).

```ini
# MongoDB Atlas
MONGODB_URI="mongodb+srv://<user>:<pass>@pongbom.ryytcor.mongodb.net"
MONGODB_DB=pongbom

# Tài khoản admin (đặt mạnh cho production)
ADMIN_USER=<tên_đăng_nhập>
ADMIN_PASS=<mật_khẩu_mạnh>
ADMIN_SECRET=<chuỗi_ngẫu_nhiên>     # tạo bằng: openssl rand -hex 32

# Cloudinary (upload ảnh — dùng UNSIGNED upload preset, KHÔNG dùng api secret)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=de44lcbu1
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=pongbom
```

**Cloudinary:** vào Dashboard → Settings → Upload → Upload presets → tạo preset
**Unsigned** (ở đây tên là `pongbom`). `api_key`/`api_secret` KHÔNG dùng trong app.

**MongoDB Atlas:** Network Access → thêm IP VPS (`141.193.23.130`) vào whitelist,
nếu không app sẽ không kết nối được DB.

---

## 3. Deploy lần đầu

```bash
# Lấy code
mkdir -p /var/www && cd /var/www
git clone https://github.com/thanhtungf123/pongbom.git
cd pongbom

# Tạo .env.local (xem mục 2)
nano .env.local

# Cài & build
npm ci
npm run build

# Chạy nền bằng PM2 ở CỔNG 3005
PORT=3005 pm2 start npm --name pongbom -- start
pm2 save
pm2 startup systemd -u root --hp /root   # chạy dòng lệnh nó in ra (nếu có)

# Kiểm tra
pm2 status
curl -I http://localhost:3005            # mong đợi 200 OK, có X-Powered-By: Next.js
```

> **KHÔNG** chạy `node scripts/seed.mjs` nếu DB Atlas đã có dữ liệu — seed sẽ
> ghi đè site/games/categories bằng file JSON trong repo. Chỉ seed khi DB trống.

---

## 4. Nginx reverse proxy

File `/etc/nginx/sites-available/pongbom`:

```nginx
server {
    listen 80;
    server_name trochoi2nguoi.org www.trochoi2nguoi.org;

    location / {
        proxy_pass http://127.0.0.1:3005;
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

```bash
ln -sf /etc/nginx/sites-available/pongbom /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 5. SSL (Let's Encrypt) + Cloudflare

Domain đứng sau **Cloudflare** ở chế độ **Full** → Cloudflare kết nối origin qua
**HTTPS cổng 443**, nên pongbom bắt buộc phải có block `listen 443` + cert, nếu
không request HTTPS sẽ rơi vào server mặc định (app khác).

Cấp cert (certbot tự thêm block 443 vào file nginx `pongbom`):
```bash
certbot --nginx -d trochoi2nguoi.org -d www.trochoi2nguoi.org
# chọn 2 (redirect HTTP -> HTTPS). Cert tự gia hạn.
```

Kiểm tra qua Cloudflare:
```bash
curl -sI https://trochoi2nguoi.org | grep -iE "x-powered-by|server"
# thấy "x-powered-by: Next.js" = domain đã về pongbom
```

Nếu certbot báo lỗi `challenge failed`/`timeout` (Cloudflare chặn HTTP-01): vào
Cloudflare của domain → tạm tắt **Always Use HTTPS** hoặc chuyển record sang
**DNS only (grey cloud)** vài phút → chạy lại certbot → bật proxy lại.

---

## 6. Cập nhật code (mỗi lần sửa & push GitHub)

```bash
cd /var/www/pongbom
git pull
npm ci
npm run build
pm2 restart pongbom
```

PM2 đã `save` nên cổng 3005 + process được nhớ, VPS reboot vẫn tự lên.

---

## 7. Lệnh thường dùng

```bash
pm2 status                       # trạng thái các app
pm2 logs pongbom --lines 50      # xem log (lỗi ở pongbom-error.log)
pm2 restart pongbom              # khởi động lại
pm2 delete pongbom               # xóa process (khi cần đổi cổng/env)
ss -ltnp | grep -E ':30[0-9][0-9]'   # xem cổng nào đang bị chiếm
```

Đổi cổng (ví dụ 3005 bị trùng):
```bash
pm2 delete pongbom
cd /var/www/pongbom
PORT=<cổng_mới> pm2 start npm --name pongbom -- start
pm2 save
# rồi sửa proxy_pass trong nginx sang cổng mới + systemctl reload nginx
```

---

## 8. Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân & cách xử lý |
|---|---|
| PM2 `errored`, log `EADDRINUSE :3000` | Cổng bị app khác chiếm → chạy pongbom ở cổng khác (3005). |
| `502 Bad Gateway` | App không chạy → `pm2 status`, `pm2 logs pongbom`. |
| Vào domain ra app khác (dino…) | pongbom thiếu block `listen 443` → chạy certbot (mục 5). |
| Vẫn thấy nội dung cũ sau khi sửa | Cloudflare cache → **Caching → Purge Everything**, hoặc Ctrl+F5. |
| Không kết nối được DB | Chưa whitelist IP VPS trong MongoDB Atlas. |
| Upload ảnh lỗi | Preset chưa Unsigned, hoặc đổi `NEXT_PUBLIC_*` mà chưa `npm run build` lại. |
| Thay đổi `NEXT_PUBLIC_*` không có tác dụng | Phải `npm run build` + `pm2 restart pongbom` (biến này nhúng lúc build). |

---

## 9. Lưu ý bảo mật

- `.env.local` không bao giờ commit lên git.
- Đặt `ADMIN_PASS` đủ mạnh (mặc định code là `admin`/`admin123` nếu không set).
- Giới hạn preset Cloudinary (allowed formats, max file size) để tránh bị lạm dụng.
- Trong MongoDB Atlas nên whitelist đúng IP VPS thay vì `0.0.0.0/0`.
