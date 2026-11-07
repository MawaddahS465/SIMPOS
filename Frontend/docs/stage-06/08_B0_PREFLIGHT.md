# B0 PREFLIGHT — Audit Lingkungan (tanpa instalasi/perubahan)

Tanggal: 12 Okt 2026. OS: Windows (PowerShell). Tidak ada software diinstal, tidak ada
service dinyalakan, tidak ada database disentuh, prototype tidak diubah.

## Status per komponen

| Komponen | Status | Temuan |
|---|---|---|
| PHP CLI | NOT READY | Hanya XAMPP PHP **8.0.30**; CI4 membutuhkan **≥8.1** |
| Extension CI4 | NOT READY | `intl` **hilang** (wajib CI4); ada: mbstring, json, mysqli, mysqlnd, pdo_mysql, openssl, zip, curl, libxml |
| Composer | PARTIAL | Tidak di PATH; `latest.phar` (2.10-dev, lawas >60 hari) jalan dengan PHP 8.0 — perlu update + PHP ≥8.1 |
| MySQL/MariaDB | PARTIAL | Binary MariaDB **10.4.32** ada di XAMPP; service **mati**, port 3306 bebas; versi lawas (pertimbangkan ≥10.6) |
| Apache (XAMPP) | PARTIAL | Terinstal, mati; port 80/443 bebas (bisa `php spark serve :8080` sebagai alternatif) |
| Git | NOT READY | Tidak terinstal (wajib untuk versioning B0+) |
| Node.js + deps prototype | READY | Node v24.21.0; `node_modules` terinstal; dev server di :5173 |
| Port | READY | 80/443/3306/8080 bebas; 5173 dipakai Vite (koeksistensi OK) |
| Folder | READY | `simpos-ci4/` belum ada (tanpa tabrakan); prototype di `simpos-optik/` |

## Kekurangan (checklist instalasi — JANGAN dijalankan tanpa izin)

1. PHP ≥8.1 + intl (rekomendasi: XAMPP baru dengan PHP 8.2/8.3, atau PHP standalone + MariaDB ≥10.6).
2. Composer terbaru di PATH (`self-update` + tambah PATH).
3. Git for Windows.
4. Nyalakan MariaDB + buat database kosong `simpos_db` + user (perintah diberikan saat disetujui).
5. Verifikasi ulang: `php -v` ≥8.1, `php -m` memuat intl, `composer --version`, `mysql --version`.

## Koreksi dependensi batch

Benar: **B0 = fondasi tanpa DB auth** (skeleton CI4 + layout + CSS + halaman statis/login
mock) — autentikasi database PINDAH ke B1 (bersama migration users/sessions). B0 tidak
diblokir oleh belum adanya database; B1 diblokir sampai MariaDB jalan + PHP ≥8.1.

## Urutan rekomendasi

Pengadaan lingkungan (PHP/Composer/Git/MariaDB) → verifikasi preflight ulang → B0
(skeleton + shell visual + smoke test) → B1 (skema + seed + auth DB). Estimasi ulang
saat lingkungan READY.

## Acceptance criteria B0

1. `simpos-ci4/` terpisah; prototype utuh dan tetap jalan di :5173.
2. CI4 welcome diganti layout lavender (sidebar/topbar/login dari CSS prototype 1:1).
3. **Bootstrap nyata**: `bootstrap@5` via npm/CDN lokal, dipakai untuk grid/utilitas
   (bukti: class `row/col/d-flex/gap-*` di Views + tidak ada komponen Bootstrap yang
   menimpa identitas visual).
4. Visual parity: screenshot 3 halaman (login/dashboard/stok) vs baseline, mean-diff <3.0
   dengan penjelasan, 0 overflow di 1536×1024 + 390×844.
5. `spark migrate --all` + rollback bersih (setelah B1); suite Playwright dialihkan hijau.
