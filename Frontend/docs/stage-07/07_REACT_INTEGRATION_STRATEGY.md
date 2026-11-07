# 07 — Strategi Integrasi React (desain identik, tanpa coding kini)

Lapisan: `src/store/sharedStore.tsx` → `src/lib/repo.ts` (interface sama: products,
stock, requests, distributions, receipts, pos, mutations, transactions, audit) dengan
dua adapter: `localAdapter` (existing) dan `apiAdapter` (fetch + JWT). Komponen/pages
tidak berubah tanda tangan; CSS/DOM identik.

Sinkronisasi: fetch-on-mount + revalidate per aksi tulis; cache per query + invalidasi
selektif (stok/produk global; list per filter). Loading/empty/error/success states sudah
ada — pertahankan. Optimistic UI HANYA untuk baca/filter lokal; semua tulis tunggu
server (mencegah divergensi stok). Retry aman via idempotency keys yang sudah ada di UI.
Role switching demo → ganti token + reset cache. Offline → banner + antre baca-saja
(tanpa queue tulis stok/uang). Scope cabang = filter server + guard klien existing.

Tanpa library baru tahap ini; kontrak API = `docs/stage-03/DATA_CONTRACT.md`.
