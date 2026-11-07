# 05 — Strategi Mempertahankan UI/UX

1. **CSS disalin 1:1**: 7 file existing → `simpos-ci4/public/css/` (tokens $ → CSS var
   tetap; tanpa konversi ke tema Bootstrap). Bootstrap 5 hanya utilitas + grid;
   komponen visual (pill, cards, drawer, tabel `.tt`) tetap kelas custom.
2. **Layout identik**: `main.php` = `.app-grid` (sidebar 255px + `.mainpanel`),
   `auth.php` = `.auth-card` dua kolom; breakpoint <900px drawer + tabel scroll lokal.
3. **Ikon**: lucide-react → file SVG inline (`public/icons/*.svg`, 1:1 `size/stroke`)
   atau CDN lucide via `lucide.createIcons()` (tanpa ubah tampilan).
4. **Interaktivitas**: drawer/modal/chips/filter = JS vanilla kecil per halaman
   (perilaku sama: busy-lock, dialog konfirmasi sebelum/sesudah, empty/notice);
   pagination + ekspor = server-side (seluruh baris filter, seperti sekarang).
5. **Verifikasi**: tiap batch = screenshot Playwright URL CI4 vs baseline prototype
   (mean-diff <1.0 identik; 1–3 area disengaja) + suite lama dialihkan ke base URL CI4.
6. **Dilarang**: mengganti font/warna/radius/spacing, menambah chart/dekorasi,
   memakai `table-striped`/tema Bootstrap bawaan yang mengubah identitas.
