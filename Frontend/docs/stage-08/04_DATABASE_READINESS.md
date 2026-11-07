# 04 — Kesiapan Database 17 Tabel (review konseptual, tanpa SQL)

Status: rancangan `docs/stage-07/03_*` DINILAI CUKUP untuk B0 (tanpa revisi struktural).

Checklist: PK/FK per tabel ✅; UNIQUE (kode, email, 3 idem-key, `(branch,product)`,
event-key) ✅; index `(branch_id, product_id, status, created_at)` + pencarian ✅;
`branch_id` wajib kecuali master ✅; user→role/cabang ✅; IDR integer ✅;
`CHECK(saldo>=0)` + clamp aplikasi ✅; isolasi transaksi per fungsi + row-lock ✅;
konkurensi via UNIQUE + cek-ulang ✅; idempotency 3 kunci ✅; audit append-only ✅;
backup = Pro daily-7d / Free TANPA backup otomatis (risiko: dev di Free wajib dump
manual — mitigasi di `05_*`); referensi lintas-role via ID stabil ✅.

Rekomendasi revisi (dokumen, bukan eksekusi): tambah `users.last_login_at`,
`distributions.dispatched_at NULLABLE` (menunggu #3), `receipts.reviewed_by`
(menunggu #4), `products.price_version` (menunggu #7). Tanpa mengubah `03_*` diam-diam.
