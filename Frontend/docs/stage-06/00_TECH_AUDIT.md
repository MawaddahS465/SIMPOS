# 00 — Audit Teknologi Aktual (baseline migrasi, bukan asumsi)

Tanggal: 12 Okt 2026. Project: `simpos-optik/` (tidak dihapus/ditimpa tahap ini).

## Frontend (aktual, terverifikasi)

- React 18.3 + TypeScript 5.6 + Vite 5.4 + react-router-dom 6.26 + lucide-react 0.427.
- **44 file `.tsx`, 9 `.ts`, 7 `.css`** (~370 KB source): 11 halaman Kasir (+1 placeholder),
  10 Admin, 11 Owner; `AppLayout/AdminLayout/OwnerLayout`, guard per role;
  `sharedStore.tsx` (sumber data tunggal, localStorage `simpos.shared.v2`),
  `CartContext`, `session.ts`, `reports.ts` (xlsx via `xlsx`, PDF via `jspdf`).
- CSS custom murni (tanpa Bootstrap): `tokens/layout/login/dashboard/pages/admin/global`
  — design system lavender pastel yang dikunci.
- QA: 5 suite Playwright Python (99/99), typecheck; 66+ screenshot baseline.

## Backend / database (aktual)

- **Tidak ada**: tanpa PHP, tanpa MySQL di repo maupun di mesin ini
  (`php`/`mysql` tidak ditemukan; hanya Node 24). Seluruh "server" = validasi di store.
- Konsekuensi: RBAC, idempotency, dan transaksi atomik saat ini level klien (DEMO_ONLY).

## Keputusan dosen (input baru, mengikat)

CodeIgniter 4 + MySQL + Bootstrap 5 WAJIB. Strategi di `01_*`: CI4 sebagai backend +
server-rendered Views di folder terpisah (`simpos-ci4/`), prototype React dipertahankan
sebagai baseline visual/fungsional + kontrak API. Tanpa rewrite destruktif; 14 item
Tahap 05 tetap PENDING (tidak diimplementasikan lewat migrasi ini).
