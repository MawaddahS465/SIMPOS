# SIMPOS — Optik Mekar Jaya

Prototype sistem informasi penjualan optik dengan tiga peran: **Kasir**, **Admin Cabang**, dan **Pemilik**.
Frontend React + TypeScript + Vite. Autentikasi dan alur transaksi Kasir memakai REST API Backend
CodeIgniter 4 dan MySQL. Integrasi data Admin Cabang dan Pemilik masih bertahap.

## Menjalankan

Prasyarat: Node.js 18+ dan PHP 8.2+.

Backend harus berjalan di `http://127.0.0.1:8080`:

```sh
cd ../Backend
php spark serve --host 127.0.0.1 --port 8080
```

Frontend:

```sh
npm install
cp .env.example .env   # sekali saja
npm run dev            # buka http://127.0.0.1:5173
npm run build
npm run typecheck
```

Dengan `VITE_API_BASE_URL=/`, request `/api` diteruskan proxy Vite ke
`http://127.0.0.1:8080` (lihat `vite.config.ts`). Karena same-origin, tidak ada
preflight CORS dan cookie session tetap first-party. Cara ini menghindari
`ERR_EMPTY_RESPONSE` dari `php spark serve` saat browser mengirim preflight.
Isi URL absolut (mis. `http://127.0.0.1:8080`) hanya bila frontend tidak
dijalankan lewat Vite dev server.

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

## Integrasi data

- Login, cek session (`GET /api/me`), dan logout (`POST /api/logout`) memakai Backend.
- Katalog/stok, pelanggan, resep, checkout, catatan pembayaran, dan riwayat transaksi
  Kasir menggunakan endpoint `/api/kasir/*` dan database Backend.
- Keranjang dan preferensi tampilan masih sementara di sisi browser; Backend memvalidasi
  stok, menghitung PPN, dan menyimpan transaksi sebelum halaman sukses ditampilkan.
- PO (termasuk pengambilan PO), halaman `/pembayaran`, serta Dashboard, Admin Cabang,
  dan Pemilik masih menggunakan store demo/localStorage. Modul-modul itu belum menjadi
  sumber data MySQL dan tidak boleh dianggap sinkron dengan Backend sampai endpoint
  dan tabel terkait diintegrasikan.
- Data localStorage lama tidak otomatis dipindahkan ke MySQL. Perubahan data lokal lama
  tidak muncul di database; ekspor/backup dulu sebelum membersihkan penyimpanan browser.
