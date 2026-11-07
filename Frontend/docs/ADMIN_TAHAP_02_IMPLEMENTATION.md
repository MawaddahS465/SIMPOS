# ADMIN TAHAP 02 — Implementation Notes

## 1. Ringkasan audit Tahap 01 (pra-kerja, ≤15 baris)

1. Stack: React 18 + TS + Vite 5, react-router 6, Lucide, CSS tokens; tanpa backend.
2. Data: katalog/pelanggan/mock statis + `CartContext` (Kasir) + `adminStore` localStorage (Admin).
3. Modul Admin Tahap 01 (login, dashboard, produk frame/lensa, stok, shell, guard) berjalan baik.
4. Kasir: checkout `complete()` tidak menyentuh stok; PO/katalog/riwayat dibaca dari statis.
5. Tidak ada jalur data lintas-role — dibangun di Tahap 02 ini.
6. Aturan: CSS Kasir tidak diubah; edit Kasir hanya penggantian sumber data + 1 pemanggilan.
7. Baru: `sharedStore` pusat (produk, stok/product+branch, distribusi, penerimaan, pengajuan +
   antrean Pemilik, PO + timeline + snapshot resep, mutasi, audit) + idempotency.
8. Migrasi: `adminStore.tsx` dihapus (duplikat); draf Tahap 01 dimigrasikan menjadi pengajuan.
9. Sidebar: 6 menu Tahap 02 diaktifkan (slot `stage: 2` → aktif + rute).
10. Aturan ditegakkan di store: alokasi read-only; stok hanya via event; PO Dipesan→Diproses→
    Sudah Datang; Selesai diblokir (PRD terbuka).
11. Visual: reuse `pages.css`/`admin.css` (+kelas `.recv-*`, `.notice-ok`); tabel-first.

## 2. Rute

- `/admin/penerimaan`, `/admin/distribusi`, `/admin/pengajuan`, `/admin/pemesanan`,
  `/admin/pemesanan/:id`, `/admin/mutasi` (guard Admin, prefix `/admin` dipertahankan).

## 3. File dibuat / diubah

Dibuat: `src/store/sharedStore.tsx`, `src/pages/admin/Admin{Penerimaan,Distribusi,Pengajuan,
Pemesanan,DetailPo,Mutasi}Page.tsx`, `qa/admin/TAHAP_02_{VISUAL_AUDIT,UAT}.md`,
`docs/ADMIN_TAHAP_02_IMPLEMENTATION.md`, `qa/admin/desktop/*`, `qa/admin/mobile/*`.
Diubah: `src/App.tsx` (provider + rute), `src/data/admin.ts` (menu aktif, store key),
`src/components/ui.tsx` (+6 label status; Kasir tak terpengaruh),
`src/styles/admin.css` (+gaya penerimaan), `src/pages/admin/AdminDashboardPage.tsx`
(sumber shared + tautan aktif), `src/pages/{TransaksiBaru,Checkout,Pemesanan,DetailPo,
Riwayat}Page.tsx` (sumber shared + `recordSale`; UI Kasir identik).
Dihapus: `src/store/adminStore.tsx` (diganti shared).

## 4. Kontrak data & event

`branch_id`, `product_id`, `distribution_id` (+lines alokasi/diterima), `receipt_id`
(+`idempotencyKey = distribution::product`), `request_id` (+`notices` mock Pemilik),
`po_id` (+`timeline[]`, `resepSnapshot` terkunci), `stock_movement_id` (+sebelum/sesudah),
`created_at/by`, audit `{waktu, aktor, cabang, aksi, ref}`. Satu saldo per product+branch.

## 5. Demo alur (teruji UAT 15/15)

- Penerimaan → stok → mutasi: DIST-2026-020/P-005 qty 2 → stok 4→6, 1 mutasi IN, receipt anti-duplikat.
- Pengajuan → antrean Pemilik: P-003 ×5 → request Diajukan + 1 notice mock, stok tetap.
- PO Kasir → Admin → Kasir: PO-2026-0106 Dipesan→Diproses (+timeline/audit) → Detail PO Kasir tampil Diproses.
- Jual Kasir → stok+mutasi+riwayat: Titanium ×2 → stok 8→6, 1 OUT, trx di riwayat.

## 6. Keputusan terbuka (tidak diasumsikan)

Hak status PO `Selesai`; pengurangan stok pusat / barang in-transit; penanganan selisih &
over-delivery penerimaan; approval workflow pengajuan; master global vs per-cabang;
stok fisik pesanan PO khusus vs reguler; stack backend; RBAC server.

## 7. Keterbatasan demo & QA

localStorage = persistence demo (bukan keamanan production); akun demo jelas; tidak ada
pembayaran/fitur Pemilik/supplier di Admin. Typecheck bersih, 0 pageerror, mobile tanpa
overflow halaman. Visual Tahap 02 provisional (Tahap 01 belum dikonfirmasi).

## 8. Menjalankan website

`npm install` (sekali), `npm run dev` → http://localhost:5173.
Kasir: `/login` (`kasir@mekarjaya.demo / demo123`). Admin: `/admin/login`
(`admin@mekarjaya.demo / demo123`).
