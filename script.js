'use strict';

/* =========================================================
   BÁO TƯỜNG LỚP 12A1 — LOGIC SÁCH LẬT
   - Dùng thư viện StPageFlip (page-flip) chạy hoàn toàn phía trình duyệt.
   - Không cần máy chủ, mở index.html là chạy.
   ========================================================= */

/* ------------------- 1. CẤU HÌNH ------------------- */

// Số trang của báo tường (đổi thành 6 nếu bạn thêm/bớt trang).
const SO_TRANG = 6;

// Tỉ lệ trang: chiều cao / chiều rộng (ảnh 3:4 nên = 4/3).
const TI_LE_TRANG = 4 / 3;

// Thông tin từng trang. Ảnh nhỏ để tải nhanh, ảnh lớn để xem nét.
const DS_TRANG = Array.from({ length: SO_TRANG }, (_, i) => {
  const so = i + 1;
  const kichThuoc = [
    '1792 × 2400',
    '1792 × 2400',
    '1790 × 2400',
    '4772 × 6400',
    '896 × 1200',
    '1790 × 2400'
  ][i] || '';

  return {
    so,
    nho: `images/page-${so}-small.webp`,
    lon: `images/page-${so}.webp`,
    zoom: `images/page-${so}-zoom.webp`,
    goc: `downloads/trang-${so}.jpg`,
    moTa: so === 1 ? 'Trang 1 – Bìa báo tường lớp 12A1' : `Trang ${so} – Báo tường lớp 12A1`,
    kichThuoc
  };
});

/* ------------------- 2. TRUY CẬP PHẦN TỬ ------------------- */

const $ = (id) => document.getElementById(id);

const appEl = $('app');
const stageInner = $('stageInner');
const bookShell = $('bookShell');
const loader = $('loader');
const pageNow = $('pageNow');
const prevBtn = $('prevBtn');
const nextBtn = $('nextBtn');
const zoomBtn = $('zoomBtn');
const fsBtn = $('fsBtn');
const downloadBtn = $('downloadBtn');

const zoomDialog = $('zoomDialog');
const zoomLabel = $('zoomLabel');
const zoomImg = $('zoomImg');
const zoomLevel = $('zoomLevel');
const zoomViewport = $('zoomViewport');
const zoomPrev = $('zoomPrev');
const zoomNext = $('zoomNext');
const zoomIn = $('zoomIn');
const zoomOut = $('zoomOut');
const zoomReset = $('zoomReset');
const zoomClose = $('zoomClose');

const downloadDialog = $('downloadDialog');
const downloadList = $('downloadList');

/* ------------------- 3. TRẠNG THÁI ------------------- */

let flipper = null;          // Đối tượng StPageFlip hiện tại
let bookEl = null;           // Phần tử chứa các trang (bị thư viện xoá khi destroy)
let trangHienTai = 0;        // Chỉ số trang đang xem (bắt đầu từ 0)
let kichThuoc = null;        // { pageW, pageH, haiTrang }
let daKhoiTao = false;       // Đã dựng sách lần đầu chưa
let henCapNhat = 0;          // Bộ đếm thời gian cho việc co giãn cửa sổ

const anhNet = new Set();    // Các trang đã tải ảnh độ nét cao

// Người dùng có bật chế độ giảm chuyển động không?
const giamChuyenDong = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------- 4. TÍNH KÍCH THƯỚC SÁCH ------------------- */

/**
 * Tính kích thước 1 trang sao cho vừa màn hình.
 * - Màn hình đủ rộng: 2 trang đối diện.
 * - Điện thoại / máy tính bảng dọc: 1 trang.
 */
function tinhKichThuoc() {
  const rong = stageInner.clientWidth;
  const cao = stageInner.clientHeight;

  // Chỉ xem 2 trang khi đủ chỗ và màn hình nghiêng ngang.
  let haiTrang = rong >= 720 && rong >= cao * 0.95;

  let pageH;
  let pageW;

  if (haiTrang) {
    // Tổng chiều rộng 2 trang = 1.5 × chiều cao trang
    pageH = Math.min(cao, rong / 1.5);
    pageW = pageH * 0.75;

    // Nếu mỗi trang quá hẹp thì quay về chế độ 1 trang cho dễ đọc.
    if (pageW < 240) haiTrang = false;
  }

  if (!haiTrang) {
    pageH = Math.min(cao, rong / 0.75);
    pageW = pageH * 0.75;
  }

  // Không phóng to quá mức trên màn hình rất lớn.
  const caoToiDa = 1080;
  if (pageH > caoToiDa) {
    pageH = caoToiDa;
    pageW = pageH * 0.75;
  }

  return {
    pageW: Math.max(160, Math.floor(pageW)),
    pageH: Math.max(213, Math.floor(pageH)),
    haiTrang
  };
}

/* ------------------- 5. SINH HTML CÁC TRANG ------------------- */

function taoHtmlTrang() {
  return DS_TRANG.map((trang, i) => {
    // Trang đầu là bìa cứng, các trang sau là trang mềm.
    const day = i === 0 ? 'hard' : 'soft';

    // Chỉ tải ảnh nét cao cho 2 trang đầu; các trang khác dùng ảnh nhẹ.
    const nenDungAnhLon = i < 2 || anhNet.has(i);
    const src = nenDungAnhLon ? trang.lon : trang.nho;

    return `
      <div class="page" data-density="${day}" data-index="${i}">
        <div class="page__inner">
          <img class="page__img" src="${src}"
               data-nho="${trang.nho}" data-lon="${trang.lon}"
               alt="${trang.moTa}" draggable="false" decoding="async">
        </div>
      </div>`;
  }).join('');
}

/** Nâng ảnh của trang sắp xem lên bản nét cao (lazy-load theo nhu cầu). */
function taiAnhNet(index) {
  if (!bookEl) return;

  const tu = Math.max(0, index - 1);
  const den = Math.min(SO_TRANG - 1, index + 2);

  for (let i = tu; i <= den; i++) anhNet.add(i);

  bookEl.querySelectorAll('.page__img').forEach((img) => {
    const page = img.closest('.page');
    if (!page) return;
    const i = Number(page.dataset.index);
    if (anhNet.has(i) && img.getAttribute('src') !== DS_TRANG[i].lon) {
      img.src = DS_TRANG[i].lon;
    }
  });
}

/* ------------------- 6. DỰNG LẠI SÁCH ------------------- */

/**
 * Tạo mới toàn bộ sách (dùng cho lần đầu và khi xoay màn hình / đổi kích thước).
 * StPageFlip sẽ xoá phần tử sách cũ khi gọi destroy(), nên phải tạo lại DOM.
 */
function dungSach(trangCanMo = 0) {
  if (typeof window.St === 'undefined' || !window.St.PageFlip) {
    loader.textContent = 'Không tải được thư viện lật trang. Hãy kiểm tra file lib/page-flip.browser.js.';
    return;
  }

  const kt = tinhKichThuoc();
  kichThuoc = kt;

  // Huỷ sách cũ (nếu có)
  if (flipper) {
    try {
      flipper.destroy();
    } catch (e) {
      console.warn('Không thể huỷ sách cũ:', e);
    }
    flipper = null;
  }

  // Kích thước khung sách: 1 trang hoặc 2 trang
  bookShell.style.width = (kt.haiTrang ? kt.pageW * 2 : kt.pageW) + 'px';
  bookShell.style.height = kt.pageH + 'px';

  // Tạo phần tử sách mới
  bookEl = document.createElement('div');
  bookEl.className = 'book';
  bookEl.id = 'book';
  bookEl.innerHTML = taoHtmlTrang();
  bookShell.prepend(bookEl);

  const trangBatDau = Math.max(0, Math.min(SO_TRANG - 1, trangCanMo));

  flipper = new window.St.PageFlip(bookEl, {
    // Kích thước cố định do JS tính
    width: kt.pageW,
    height: kt.pageH,
    size: 'fixed',
    minWidth: kt.pageW,
    maxWidth: kt.pageW,
    minHeight: kt.pageH,
    usePortrait: !kt.haiTrang,
    showCover: true,                 // Trang 1 là bìa, hiển thị đơn
    startPage: trangBatDau,
    drawShadow: true,                // Đổ bóng khi lật
    maxShadowOpacity: 0.5,
    flippingTime: giamChuyenDong ? 380 : 850,
    useMouseEvents: true,
    mobileScrollSupport: true,       // Cho phép vuốt dọc trên điện thoại
    swipeDistance: 30,
    showPageCorners: true,           // Hiện gấp góc khi rê chuột
    clickEventForward: true,         // Bấm vào góc trang để lật
    startZIndex: 1
  });

  // Cập nhật khi lật trang xong
  flipper.on('flip', (e) => {
    // Thư viện trả về trực tiếp số trang (một số bản trả về { page, mode })
    const duLieu = e && e.data;
    if (typeof duLieu === 'number') trangHienTai = duLieu;
    else if (duLieu && typeof duLieu.page === 'number') trangHienTai = duLieu.page;

    capNhatThanhCongCu();
    taiAnhNet(trangHienTai);
  });

  // Ẩn vệt gáy khi trang đang bay
  flipper.on('changeState', (e) => {
    bookShell.classList.toggle('is-flipping', e.data !== 'read');
  });

  // Nạp nội dung các trang vào thư viện
  flipper.loadFromHTML(bookEl.querySelectorAll('.page'));

  trangHienTai = flipper.getCurrentPageIndex();
  taiAnhNet(trangHienTai);
  capNhatThanhCongCu();

  // Ẩn màn hình chờ sau khi ảnh bìa sẵn sàng
  const anhBia = bookEl.querySelector('.page__img');
  if (anhBia) {
    const xong = () => anLoader();
    if (anhBia.complete && anhBia.naturalWidth > 0) xong();
    else {
      anhBia.addEventListener('load', xong, { once: true });
      anhBia.addEventListener('error', xong, { once: true });
    }
  } else {
    anLoader();
  }

  daKhoiTao = true;
}

function anLoader() {
  loader.classList.add('is-hidden');
  window.setTimeout(() => loader.setAttribute('hidden', ''), 420);
}

/* ------------------- 7. THANH CÔNG CỤ ------------------- */

function capNhatThanhCongCu() {
  if (!flipper) return;

  const haiTrang = flipper.getOrientation() === 'landscape';

  // Hiển thị "2 – 3 / 6" khi đang xem 2 trang đối diện
  let hienThi = String(trangHienTai + 1);
  if (haiTrang && trangHienTai > 0 && trangHienTai + 1 < SO_TRANG) {
    hienThi = `${trangHienTai + 1} – ${trangHienTai + 2}`;
  }
  pageNow.textContent = `${hienThi} / ${SO_TRANG}`;

  // Chỉ bật vệt gáy + đổ bóng khung khi thật sự đang mở 2 trang
  const dangMoHaiTrang = haiTrang && trangHienTai > 0 && trangHienTai < SO_TRANG - 1;
  bookShell.classList.toggle('is-spread', dangMoHaiTrang);

  // Trang cuối của chế độ hiện tại
  let trangCuoi;
  if (haiTrang) {
    trangCuoi = SO_TRANG % 2 === 0 ? SO_TRANG - 1 : SO_TRANG - 2;
  } else {
    trangCuoi = SO_TRANG - 1;
  }

  prevBtn.disabled = trangHienTai <= 0;
  nextBtn.disabled = trangHienTai >= trangCuoi;
}

function latTruoc() {
  if (!flipper) return;
  flipper.flipPrev();
}

function latSau() {
  if (!flipper) return;
  flipper.flipNext();
}

prevBtn.addEventListener('click', latTruoc);
nextBtn.addEventListener('click', latSau);

/* ------------------- 8. PHÓNG TO ------------------- */

let chiSoZoom = 0;
const zoom = {
  scale: 1,
  x: 0,
  y: 0,
  min: 1,
  max: 4
};

function gioiHan(giaTri, min, max) {
  return Math.min(max, Math.max(min, giaTri));
}

function gioiHanPan() {
  const r = zoomViewport.getBoundingClientRect();
  const maxX = Math.max(0, (r.width * (zoom.scale - 1)) / 2);
  const maxY = Math.max(0, (r.height * (zoom.scale - 1)) / 2);
  zoom.x = gioiHan(zoom.x, -maxX, maxX);
  zoom.y = gioiHan(zoom.y, -maxY, maxY);
}

function apDungZoom() {
  zoomImg.style.transform = `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`;
  zoomLevel.textContent = `${Math.round(zoom.scale * 100)}%`;
}

function datLaiZoom() {
  zoom.scale = 1;
  zoom.x = 0;
  zoom.y = 0;
  apDungZoom();
}

function datTiLeZoom(moi, tamX, tamY) {
  const tiLeCu = zoom.scale;
  const tiLeMoi = gioiHan(moi, zoom.min, zoom.max);
  if (Math.abs(tiLeMoi - tiLeCu) < 0.0001) return;

  if (typeof tamX === 'number' && typeof tamY === 'number') {
    // Giữ điểm dưới con trỏ đứng yên khi phóng to/thu nhỏ
    const r = zoomViewport.getBoundingClientRect();
    const cx = tamX - r.left - r.width / 2;
    const cy = tamY - r.top - r.height / 2;
    const tiSo = tiLeMoi / tiLeCu;
    zoom.x = cx - (cx - zoom.x) * tiSo;
    zoom.y = cy - (cy - zoom.y) * tiSo;
  }

  zoom.scale = tiLeMoi;
  if (tiLeMoi <= 1.001) {
    zoom.x = 0;
    zoom.y = 0;
  }
  gioiHanPan();
  apDungZoom();
}

function hienThiTrangZoom() {
  const trang = DS_TRANG[chiSoZoom];
  if (!trang) return;

  zoomLabel.textContent = `Trang ${chiSoZoom + 1} / ${SO_TRANG}`;
  zoomPrev.disabled = chiSoZoom <= 0;
  zoomNext.disabled = chiSoZoom >= SO_TRANG - 1;

  datLaiZoom();

  // Hiện vòng xoay chờ trong lúc tải ảnh
  zoomViewport.classList.add('is-loading');
  zoomImg.classList.add('is-loading');

  const xong = () => {
    zoomViewport.classList.remove('is-loading');
    zoomImg.classList.remove('is-loading');
  };

  zoomImg.onload = xong;
  zoomImg.onerror = xong;
  zoomImg.src = trang.zoom;
  zoomImg.alt = trang.moTa;

  if (zoomImg.complete && zoomImg.naturalWidth > 0) xong();
}

function moZoom() {
  chiSoZoom = trangHienTai;
  hienThiTrangZoom();
  if (typeof zoomDialog.showModal === 'function') zoomDialog.showModal();
}

function dongZoom() {
  zoomDialog.close();
}

zoomBtn.addEventListener('click', moZoom);
zoomClose.addEventListener('click', dongZoom);
zoomIn.addEventListener('click', () => datTiLeZoom(zoom.scale * 1.4));
zoomOut.addEventListener('click', () => datTiLeZoom(zoom.scale / 1.4));
zoomReset.addEventListener('click', datLaiZoom);

zoomPrev.addEventListener('click', () => {
  if (chiSoZoom > 0) {
    chiSoZoom -= 1;
    hienThiTrangZoom();
  }
});

zoomNext.addEventListener('click', () => {
  if (chiSoZoom < SO_TRANG - 1) {
    chiSoZoom += 1;
    hienThiTrangZoom();
  }
});

// Cuộn chuột để phóng to / thu nhỏ
zoomViewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const heSo = Math.exp(-e.deltaY * 0.0016);
  datTiLeZoom(zoom.scale * heSo, e.clientX, e.clientY);
}, { passive: false });

// Kéo để di chuyển ảnh + chụm 2 ngón để phóng to
const conTro = new Map();
let panBatDau = null;
let pinchBatDau = null;

zoomViewport.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;

  conTro.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (zoomViewport.setPointerCapture) {
    try { zoomViewport.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
  }

  if (conTro.size === 1) {
    panBatDau = { x: e.clientX, y: e.clientY, ox: zoom.x, oy: zoom.y };
    pinchBatDau = null;
    zoomViewport.classList.add('is-dragging');
  } else if (conTro.size === 2) {
    const [a, b] = [...conTro.values()];
    pinchBatDau = {
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      scale: zoom.scale,
      mx: (a.x + b.x) / 2,
      my: (a.y + b.y) / 2,
      ox: zoom.x,
      oy: zoom.y
    };
    panBatDau = null;
  }
});

zoomViewport.addEventListener('pointermove', (e) => {
  if (!conTro.has(e.pointerId)) return;
  conTro.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (conTro.size >= 2 && pinchBatDau) {
    const [a, b] = [...conTro.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    zoom.scale = gioiHan(pinchBatDau.scale * (dist / pinchBatDau.dist), zoom.min, zoom.max);
    zoom.x = pinchBatDau.ox + (mx - pinchBatDau.mx);
    zoom.y = pinchBatDau.oy + (my - pinchBatDau.my);

    gioiHanPan();
    apDungZoom();
    return;
  }

  if (panBatDau && conTro.size === 1) {
    zoom.x = panBatDau.ox + (e.clientX - panBatDau.x);
    zoom.y = panBatDau.oy + (e.clientY - panBatDau.y);
    gioiHanPan();
    apDungZoom();
  }
});

function ketThucConTro(e) {
  conTro.delete(e.pointerId);

  if (conTro.size === 1) {
    const conLai = [...conTro.values()][0];
    panBatDau = { x: conLai.x, y: conLai.y, ox: zoom.x, oy: zoom.y };
    pinchBatDau = null;
  } else if (conTro.size === 0) {
    panBatDau = null;
    pinchBatDau = null;
    zoomViewport.classList.remove('is-dragging');
  } else {
    pinchBatDau = null;
  }
}

zoomViewport.addEventListener('pointerup', ketThucConTro);
zoomViewport.addEventListener('pointercancel', ketThucConTro);

// Nháy đúp để phóng to 200% hoặc trở về vừa khung
zoomViewport.addEventListener('dblclick', (e) => {
  datTiLeZoom(zoom.scale > 1.2 ? 1 : 2, e.clientX, e.clientY);
});

// Bàn phím riêng của hộp thoại phóng to
zoomDialog.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    zoomPrev.click();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    zoomNext.click();
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    datTiLeZoom(zoom.scale * 1.25);
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault();
    datTiLeZoom(zoom.scale / 1.25);
  } else if (e.key === '0') {
    e.preventDefault();
    datLaiZoom();
  }
});

// Bấm ra vùng tối bên ngoài để đóng
zoomDialog.addEventListener('click', (e) => {
  if (e.target === zoomDialog) dongZoom();
});

/* ------------------- 9. TẢI ẢNH ------------------- */

function taoDanhSachTai() {
  const icon = `
    <svg class="download-list__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  downloadList.innerHTML = DS_TRANG.map((trang) => `
    <li>
      <a href="${trang.goc}" download="trang-${trang.so}.jpg">
        <span class="download-list__num">${trang.so}</span>
        <span class="download-list__name">${trang.so === 1 ? 'Trang 1 · Bìa' : `Trang ${trang.so}`}</span>
        <span class="download-list__meta">${trang.kichThuoc} · JPG</span>
        ${icon}
      </a>
    </li>`).join('');
}

function moTaiAnh() {
  downloadDialog.showModal();
}

downloadBtn.addEventListener('click', moTaiAnh);

downloadDialog.addEventListener('click', (e) => {
  if (e.target === downloadDialog) downloadDialog.close();
});

// Bấm xong thì đóng hộp thoại sau một nhịp ngắn
downloadList.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    window.setTimeout(() => downloadDialog.close(), 500);
  }
});

document.querySelectorAll('[data-close]').forEach((nut) => {
  nut.addEventListener('click', () => {
    const hop = nut.closest('dialog');
    if (hop) hop.close();
  });
});

/* ------------------- 10. TOÀN MÀN HÌNH ------------------- */

function capNhatNutToanManHinh() {
  const dangToanManHinh =
    Boolean(document.fullscreenElement) || document.body.classList.contains('is-fake-fullscreen');

  fsBtn.setAttribute('aria-pressed', String(dangToanManHinh));
  fsBtn.setAttribute('aria-label', dangToanManHinh ? 'Thoát toàn màn hình' : 'Bật toàn màn hình');
  fsBtn.title = dangToanManHinh ? 'Thoát toàn màn hình (F)' : 'Toàn màn hình (F)';

  const nhan = fsBtn.querySelector('.btn__label');
  if (nhan) nhan.textContent = dangToanManHinh ? 'Thoát' : 'Toàn màn hình';
}

async function batTatToanManHinh() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } else {
      throw new Error('Trình duyệt không hỗ trợ toàn màn hình');
    }
  } catch (err) {
    // Trình duyệt không hỗ trợ (ví dụ Safari trên iPhone): dùng chế độ giả lập
    document.body.classList.toggle('is-fake-fullscreen');
    capNhatNutToanManHinh();
    lenLichCapNhat(true);
  }
}

fsBtn.addEventListener('click', batTatToanManHinh);

document.addEventListener('fullscreenchange', () => {
  capNhatNutToanManHinh();
  lenLichCapNhat(true);
});

/* ------------------- 11. PHÍM TẮT ------------------- */

document.addEventListener('keydown', (e) => {
  // Khi đang mở hộp thoại thì nhường phím cho hộp thoại
  if (zoomDialog.open || downloadDialog.open) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    latTruoc();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    latSau();
  } else if (e.key === 'z' || e.key === 'Z') {
    moZoom();
  } else if (e.key === 'f' || e.key === 'F') {
    batTatToanManHinh();
  } else if (e.key === 'd' || e.key === 'D') {
    moTaiAnh();
  } else if (e.key === 'Escape' && document.body.classList.contains('is-fake-fullscreen')) {
    document.body.classList.remove('is-fake-fullscreen');
    capNhatNutToanManHinh();
    lenLichCapNhat(true);
  }
});

/* ------------------- 12. CO GIÃN / XOAY MÀN HÌNH ------------------- */

function lenLichCapNhat(ngay = false) {
  window.clearTimeout(henCapNhat);
  henCapNhat = window.setTimeout(() => {
    if (!daKhoiTao) return;

    const kt = tinhKichThuoc();
    const thayDoi =
      !kichThuoc ||
      kt.haiTrang !== kichThuoc.haiTrang ||
      Math.abs(kt.pageW - kichThuoc.pageW) > 1 ||
      Math.abs(kt.pageH - kichThuoc.pageH) > 1;

    if (thayDoi) dungSach(trangHienTai);
  }, ngay ? 0 : 180);
}

window.addEventListener('resize', () => lenLichCapNhat());
window.addEventListener('orientationchange', () => lenLichCapNhat());

if (typeof ResizeObserver !== 'undefined') {
  const quanSat = new ResizeObserver(() => lenLichCapNhat());
  quanSat.observe(stageInner);
}

/* ------------------- 13. KHỞI ĐỘNG ------------------- */

function khoiDong() {
  taoDanhSachTai();
  dungSach(0);
  capNhatNutToanManHinh();

  // Sau khi trang ổn định, tải trước ảnh nét cao cho các trang còn lại.
  // Bỏ qua nếu người dùng đang tiết kiệm dữ liệu.
  const tietKiemDuLieu = navigator.connection && navigator.connection.saveData;
  if (!tietKiemDuLieu) {
    window.setTimeout(() => {
      taiAnhNet(SO_TRANG - 1);
      taiAnhNet(0);
    }, 2500);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', khoiDong);
} else {
  khoiDong();
}
