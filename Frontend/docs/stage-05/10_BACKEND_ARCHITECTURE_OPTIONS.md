# 10 — Backend Architecture Options (konseptual, tanpa implementasi)

## Audit stack aktual

Prototype: React 18 + TS + Vite 5, SPA, state `sharedStore` (localStorage
`simpos.shared.v2`), tanpa API/DB/auth server. Kontrak siap migrasi:
`docs/stage-03/DATA_CONTRACT.md`. Charter: CI4/MySQL; Bab II: React/Supabase —
repository nyata = React; **tanpa pilihan sepihak tahap ini**.

## Alternatif

- **Opsi 1 — Supabase (Postgres + Auth + RLS).** Cocok: frontend tetap React;
  RLS = penegakan cabang per role; realtime untuk Kasir↔Admin. Risiko: vendor lock-in,
  RPO/RTO di tangan vendor, biaya.
- **Opsi 2 — CI4/MySQL VPS sendiri.** Cocok: Charter; kontrol penuh backup/HTTPS.
  Risiko: bangun API + auth + migrasi dari nol; butuh admin server.
- **Opsi 3 — Tetap prototype (ditolak untuk produksi).** Hanya demo/UAT klien.

## Kebutuhan (semua opsi backend)

Postgres/MySQL: `branches, users(roles), products, branch_stocks(UNIQUE branch,product,
CHECK qty≥0), central_stocks, stock_requests, distributions(+lines), receipts
(UNIQUE idemKey), stock_movements(UNIQUE event key), pos(+timeline, snapshot),
transactions(+idempotency), audit_logs`. API: auth JWT/session, RBAC guard per endpoint,
transaksi atomik alokasi/receipt/sale (row lock `version`), idempotency keys,
pagination, ekspor server-side. Backup harian + uji restore, TLS, log audit, monitoring.

## Estimasi (asumsi: 1 BE + 1 FE paruh waktu, kontrak data dipakai ulang)

Desain skema+RLS/policy: 1–2 mgg. API auth/stok/PO/alokasi/laporan: 3–5 mgg.
Migrasi seed + UAT backend: 1–2 mgg. Hardening + deploy staging: 1–2 mgg.
Total indikatif 6–11 mgg SETELAH 14 keputusan disahkan. Bukan komitmen.
