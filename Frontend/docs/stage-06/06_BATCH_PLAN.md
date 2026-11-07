# 06 — Batch Implementasi (kecil, teruji, terbanding)

| Batch | Isi | Gate lulus |
|---|---|---|
| B0 | PHP 8.1+ + MySQL + CI4 skeleton + `.env` + auth 3 role + layout auth/shell | login 3 role, guard redirect, screenshot shell ≈ baseline |
| B1 | Skema + seed demo + Models | 99/99 logika vs seed; rollback OK |
| B2 | Katalog + produk + stok read-only (Kasir+Admin+Owner) | INT-05/06, diff visual katalog |
| B3 | Checkout + sale atomik + idempotency | INT-12/13/15, NEG-1, receipt cocok |
| B4 | PO Kasir + proses Admin + monitor Owner | INT-07/08, U6-U8, S5/S6 |
| B5 | Pengajuan + alokasi + penerimaan + mutasi | CP2 29/29 vs API |
| B6 | Monitoring transaksi/PO + 4 laporan + ekspor | CP3 14/14, file dibuka & total cocok |
| B7 | Hardening (CSRF, session DB, rate-limit login, backup) + UAT 16 | UAT 14/14, SECURITY audit |

Tiap batch: migrasi `spark`, suite dialihkan, screenshot diff, rollback plan.
Estimasi kesulitan: B0 rendah-menengah (lingkungan), B1–B2 rendah, B3–B5 menengah
(atomik/idempotency), B6 menengah (ekspor), B7 menengah-tinggi.
Risiko utama: tanpa PHP/MySQL lokal (pengadaan dulu); perbedaan perilaku tanggal/angka
ID; parkir 14 PENDING (tanpa implementasi); scope-creep laporan.
Urutan wajib B0→B7 berurutan; dilarang loncat ke ekspor sebelum stok atomik hijau.
