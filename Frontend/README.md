# SIMPOS — Optik Mekar Jaya

Prototype sistem informasi penjualan optik dengan tiga peran: **Kasir**, **Admin Cabang**, dan **Pemilik**.
Frontend React + TypeScript + Vite. Autentikasi dan session memakai REST API Backend
CodeIgniter 4; data bisnis yang belum diintegrasikan masih memakai `localStorage`.

## Menjalankan

Backend harus berjalan di `http://localhost:8080`:

```sh
cd ../Backend
php spark serve --port 8080
```

Frontend:

```sh
npm install
npm run dev        # buka http://127.0.0.1:5173
npm run build
npm run typecheck
```

Gunakan `http://127.0.0.1:5173` (bukan `localhost:5173`) agar cocok dengan
origin CORS Backend. Base URL API dapat dioverride lewat `VITE_API_BASE_URL`
(lihat `.env.example`).

## Akun login

Autentikasi memakai username/password dari database Backend, bukan akun demo frontend.

| Peran | Halaman masuk | Username | Password |
| --- | --- | --- | --- |
| Kasir | `/login` | `kasir1` | `123` |
| Admin Cabang | `/admin/login` | `admin1` | `123` |
| Pemilik | `/owner/login` | `pemilik` | `123` |

## Peta halaman

**Kasir** — `/dashboard`, `/transaksi-baru`, `/checkout`, `/transaksi-berhasil`, `/pemesanan`, `/riwayat-transaksi`, `/pelanggan`, `/resep-mata`, `/pembayaran`

**Admin Cabang** — `/admin/dashboard`, `/admin/produk/frame`, `/admin/produk/lensa`, `/admin/stok`, `/admin/penerimaan`, `/admin/distribusi`, `/admin/pengajuan`, `/admin/pemesanan`, `/admin/mutasi`

**Pemilik** — `/owner/dashboard`, `/owner/cabang`, `/owner/stok`, `/owner/pengajuan`, `/owner/alokasi`, `/owner/mutasi`, `/owner/transaksi`, `/owner/pemesanan`, `/owner/laporan`, `/owner/pengaturan`

## Struktur

```
src/
├─ components/   layout per peran, guard rute, komponen UI
├─ pages/        halaman Kasir, admin/, owner/
├─ store/        auth (session Backend) + sharedStore (data bisnis lokal)
├─ context/      keranjang & perhitungan checkout
├─ data/         data demo (produk, pelanggan, PO, navigasi)
└─ styles/       tokens, layout, halaman
qa/              skrip uji Playwright per tahap
docs/            catatan audit, keputusan, dan laporan QA
figma-kit-export/ paket desain untuk Figma (screenshot + plugin importer)
```

## Catatan

- Login, cek session (`GET /api/me`), dan logout (`POST /api/logout`) memakai Backend.
- Role untuk proteksi route berasal dari session Backend, bukan localStorage.
- Data contoh (produk, stok, transaksi) masih lokal dan ikut ter-reset bila `localStorage` dibersihkan.
- Pengaturan Pemilik (`/owner/pengaturan`) mengubah pengguna, tarif PPN, dan batas minimum default
  pada data demo lokal; belum tersimpan ke database Backend.
