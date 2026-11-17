# Hướng dẫn sử dụng & đưa sách lật lên online

Sách lật báo tường **Báo tường lớp 12A1** — 6 trang, chạy hoàn toàn trên trình duyệt,
không cần máy chủ, không cần cài đặt gì.

---

## 1. Thư mục dự án có gì?

```
Pr1/
├── index.html              ← Trang chính (mở file này để xem)
├── style.css               ← Giao diện, màu sắc, responsive
├── script.js               ← Logic lật trang, zoom, tải ảnh
├── lib/
│   └── page-flip.browser.js  ← Thư viện lật trang (đã tải sẵn, không cần mạng)
├── images/
│   ├── page-1.webp … page-6.webp          ← Ảnh hiển thị (nét cao, nhẹ)
│   ├── page-1-small.webp … page-6-small.webp ← Ảnh xem trước (tải rất nhanh)
│   └── page-1-zoom.webp … page-6-zoom.webp   ← Ảnh riêng cho chế độ phóng to
├── downloads/
│   └── trang-1.jpg … trang-6.jpg          ← Bản JPG độ phân giải gốc để tải về/in
└── anh-goc/
    └── 1.png … 6.png                      ← Ảnh gốc bạn cung cấp (KHÔNG cần đăng online)
```

> Khi đưa lên mạng, bạn **không cần** thư mục `anh-goc/` (nặng ~49 MB).
> Chỉ cần `index.html`, `style.css`, `script.js`, `lib/`, `images/`, `downloads/`.

---

## 2. Chạy thử trên máy tính

1. Mở thư mục dự án.
2. Nháy đúp vào `index.html`.
3. Trình duyệt sẽ mở sách lật. Có thể:
   - Bấm **Trước / Sau** hoặc phím `←` `→`.
   - Kéo chuột / vuốt tay để lật.
   - Bấm vào góc trang để lật.
   - Bấm **Phóng to** (phím `Z`) để đọc chữ nhỏ, cuộn chuột hoặc chụm 2 ngón để zoom.
   - Bấm **Toàn màn hình** (phím `F`).
   - Bấm **Tải ảnh** (phím `D`) để tải bản JPG chất lượng cao.

> Nếu trình duyệt chặn tải ảnh khi mở bằng `file://`, hãy làm theo mục 5
> (đưa lên online) rồi tải từ đường link web.

---

## 3. Đổi tiêu đề báo tường

Mở `index.html` bằng Notepad (Windows) hoặc VS Code, tìm và sửa **2 chỗ**:

```html
<title>Báo tường lớp 12A1</title>
...
<h1 class="header__title">Báo tường lớp 12A1</h1>
```

Nên sửa thêm dòng mô tả để khi chia sẻ link hiển thị đẹp:

```html
<meta name="description" content="Sách lật báo tường lớp 12A1 – 6 trang, lật giở như sách thật.">
```

Lưu file rồi tải lại trang (Ctrl + F5).

---

## 4. Thay ảnh trang (khi cần cập nhật nội dung)

Giữ nguyên **tên file** và **thứ tự**:

- `images/page-1.webp` … `page-6.webp`: ảnh hiển thị, kích thước khuyến nghị **1500 × 2000 px**.
- `images/page-N-small.webp`: bản nhỏ **750 × 1000 px** cho tải nhanh.
- `images/page-N-zoom.webp`: bản **2200 × 2933 px** cho chế độ phóng to.
- `downloads/trang-N.jpg`: bản gốc chất lượng cao để tải về.

Ảnh nên có **tỉ lệ 3:4** (dọc). Nếu khác tỉ lệ, ảnh sẽ bị cắt nhẹ cho vừa trang.
Nếu chỉ thay ảnh mà không muốn tự nén, hãy nhờ người biết chỉnh ảnh xuất đúng các kích thước trên
(định dạng WebP cho ảnh hiển thị, JPG cho bản tải về).

Muốn đổi số trang? Sửa `SO_TRANG` ở đầu `script.js` và thêm đủ file ảnh tương ứng.

---

## 5. Đưa lên online miễn phí

### Cách A — Netlify Drop (dễ nhất, khoảng 2 phút)

1. Vào **https://app.netlify.com/drop**.
2. Kéo **cả thư mục dự án** (trừ `anh-goc`) thả vào ô trên trang.
3. Chờ vài giây, Netlify trả về một địa chỉ dạng `https://ten-ngau-nhien.netlify.app`.
4. Bấm **Sign up / Claim site** để giữ trang lâu dài (miễn phí).
5. Vào **Site settings → Change site name** để đổi thành tên dễ nhớ,
   ví dụ `bao-tuong-12a1` → `https://bao-tuong-12a1.netlify.app`.

**Cập nhật sau này:** vào trang quản lý site → mục **Deploys** → kéo thả lại thư mục mới.

---

### Cách B — GitHub Pages (miễn phí, đường link ổn định)

1. Tạo tài khoản tại **https://github.com** (nếu chưa có).
2. Bấm dấu **+** ở góc phải → **New repository**.
3. Đặt tên, ví dụ `bao-tuong-12a1`, chọn **Public** → **Create repository**.
4. Trong kho vừa tạo, bấm **Add file → Upload files**.
5. Mở thư mục dự án trên máy, kéo thả **`index.html`, `style.css`, `script.js`**
   và **3 thư mục** `lib`, `images`, `downloads` vào trang upload.
   - Không cần kéo `anh-goc` (nặng và không dùng khi online).
   - Nếu trình duyệt không cho kéo thư mục, hãy cài **GitHub Desktop**
     (https://desktop.github.com), chọn “Add existing repository” → chọn thư mục dự án →
     Commit → Push.
6. Bấm **Commit changes** để lưu.
7. Vào **Settings** (thanh trên cùng của kho) → mục **Pages** (cột trái).
8. Ở **Source**, chọn **Deploy from a branch**; **Branch** chọn `main`, thư mục `/ (root)`
   → bấm **Save**.
9. Chờ 1–2 phút, tải lại trang Settings → Pages. Đường link sẽ hiện ở đầu trang, dạng:
   `https://ten-tai-khoan.github.io/bao-tuong-12a1/`
10. Mở link đó trên điện thoại để kiểm tra.

**Cập nhật sau này:** vào kho → **Add file → Upload files** → ghi đè các file đã sửa → Commit.

---

### Cách C — Vercel (miễn phí, giao diện đẹp)

1. Tạo tài khoản tại **https://vercel.com** (đăng nhập bằng GitHub cho nhanh).
2. Đưa dự án lên GitHub theo **Cách B** bước 1–6 (chỉ cần đưa code lên, chưa cần bật Pages).
3. Trên Vercel, bấm **Add New… → Project**.
4. Chọn kho `bao-tuong-12a1` → bấm **Import**.
5. Ở phần cấu hình:
   - **Framework Preset**: chọn **Other**.
   - **Build Command**: để trống.
   - **Output Directory**: để trống (hoặc `.`).
6. Bấm **Deploy**, chờ khoảng 30 giây.
7. Nhận link dạng `https://bao-tuong-12a1.vercel.app`.
8. Muốn đổi tên miền phụ: **Settings → Domains** (hoặc đổi tên project).

**Cập nhật sau này:** sửa file trên GitHub → Vercel tự động deploy lại.

---

## 6. Nhúng sách lật vào website có sẵn (iframe)

Sau khi có link online (ví dụ `https://bao-tuong-12a1.netlify.app/`), dán đoạn mã sau
vào nơi cho phép chèn HTML (WordPress: khối **Custom HTML**; Google Sites: **Insert → Embed → Embed code**):

```html
<!-- Khung sách lật responsive, giữ tỉ lệ 4:3 -->
<div style="position:relative;width:100%;max-width:1100px;margin:0 auto;padding-top:70%;">
  <iframe
    src="https://bao-tuong-12a1.netlify.app/"
    title="Báo tường lớp 12A1"
    style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px;"
    loading="lazy"
    allowfullscreen>
  </iframe>
</div>
```

- Thay `src` bằng link thật của bạn.
- `padding-top:70%` giúp khung không bị méo; có thể tăng lên `80%` nếu muốn cao hơn.
- Trên điện thoại, sách tự chuyển sang 1 trang và vuốt để lật.
- Nếu website dùng WordPress, nên dùng trang riêng hoặc chế độ “Full width” để khung rộng rãi.

---

## 7. Câu hỏi thường gặp

**Trang có cần internet không?**
Không. Thư viện lật trang đã nằm trong `lib/`, ảnh nằm trong `images/`. Chỉ cần mở `index.html`.
Khi đăng online thì cần internet để người khác truy cập.

**Có cần cài Node.js, PHP hay cơ sở dữ liệu không?**
Không. Đây là website tĩnh (HTML/CSS/JS).

**Tại sao ảnh gốc không dùng trực tiếp?**
Ảnh gốc rất nặng (tổng ~49 MB), tải sẽ chậm. Bản hiển thị đã được nén WebP, còn bản gốc
được giữ trong `downloads/` cho nút “Tải ảnh”.

**Muốn đổi màu nền?**
Mở `style.css`, sửa `--nen` và `--nen-2` ở đầu file.

**Muốn đổi thời gian lật trang?**
Trong `script.js`, tìm `flippingTime` (mili giây). Hiện tại: 850 ms (hoặc 380 ms nếu
người dùng bật chế độ giảm chuyển động).
