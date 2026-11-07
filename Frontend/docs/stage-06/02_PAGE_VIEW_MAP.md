# 02 — Pemetaan Halaman → CI4 Views + Komponen Bootstrap

Konvensi: `Controller::method` → `Views/<role>/<page>.php` memakai layout
`Views/layouts/main.php` (sidebar/topbar) atau `auth.php` (login).
Partials: `_sidebar, _topbar, _pagehead, _toolbar, _table, _statcard, _statuspill,
_drawer, _modal, _pagination, _empty, _notice`. Kelas CSS existing dipakai verbatim;
Bootstrap 5 hanya untuk utilitas (`d-flex, gap-*, row/col, table-responsive, modal`
diganti drawer custom agar visual identik).

## Kasir (AuthGuard kasir)

| Route React | Controller → View |
|---|---|
| `/login` | `Auth::login` → `auth/login.php` (+session role redirect) |
| `/dashboard` | `Cashier::dashboard` → `cashier/dashboard.php` (hero + menu cards) |
| `/transaksi-baru` | `Cashier::catalog` → `cashier/catalog.php` (chips + product-grid + cart) |
| `/checkout` | `Cashier::checkout` → `cashier/checkout.php` (3 kolom + summary) |
| `/transaksi-berhasil` | `Cashier::receipt` → `cashier/receipt.php` |
| `/pemesanan`, `/:id` | `Po::index/show` → `cashier/po_*.php` (+drawer Buat PO) |
| `/riwayat-transaksi` | `Cashier::history` → `cashier/history.php` (expandable rows) |
| `/pelanggan`, `/resep-mata`, `/pembayaran` | `Customer::`, `Prescription::`, `Payment::` → views read-only |

## Admin (`AdminGuard`, scope cabang sesi)

`/admin/login` → `Auth::adminLogin`; `/admin/dashboard|produk/frame|lensa|stok|
penerimaan|distribusi|pengajuan|pemesanan|/:id|mutasi` → `Admin::*` / `Stock::*` /
`Receipt::*` / `Request::*` / `Po::admin*` → `Views/admin/*.php` (tabel-first + drawer).

## Owner (`OwnerGuard`, scope all)

`/owner/login|dashboard|cabang|cabang/:id|stok|pengajuan|alokasi|mutasi|transaksi|
pemesanan|laporan` → `Owner::*` → `Views/owner/*.php`; ekspor via library
PhpSpreadsheet + Dompdf/mPDF (pengganti `xlsx`/`jspdf`, format kolom disamakan).
