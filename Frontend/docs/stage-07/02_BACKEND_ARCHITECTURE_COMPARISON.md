# 02 — Perbandingan Arsitektur (bobot: kesesuaian repo 25, RBAC/cabang 20, integritas
transaksi 20, usaha/learning 15, biaya/ops 10, keamanan PII 10; skor 1–5)

| Kriteria (bobot) | A: Supabase+PG+Auth+RLS | B: Node TS API + PG | C: Node TS API + MySQL |
|---|---|---|---|
| Kompat React/Vite (25) | 5 — JS client resmi, refactor terkecil | 4 — fetch biasa | 4 — sama |
| RBAC + branch scope (20) | 5 — RLS per tabel; server function untuk aksi kritis | 4 — middleware manual | 4 — sama |
| Atomik/konkurensi/idempotency (20) | 4 — transaksi SQL + constraint; konkurensi via constraint | 5 — kontrol penuh (row lock, queue) | 4 — InnoDB OK; fitur PG (RETURNING/partial index) kurang |
| Usaha/learning (15) | 5 — tanpa server custom | 3 — bangun API+auth | 3 — sama + driver MySQL |
| Biaya/ops (10) | 4 — free tier ada (verifikasi ulang batas saat putuskan); vendor lock-in | 3 — VPS + kelola sendiri | 3 — sama |
| Keamanan PII (10) | 4 — RLS + enkripsi at-rest; residensi data vendor | 4 — kontrol penuh + enkripsi sendiri | 4 — sama |
| **Total /100** | **92** | **78** | **74** |

**Rekomendasi PROPOSED: Opsi A (Supabase).** Alasan: tim terbukti React/TS tanpa
backend custom; RLS menegakkan isolasi cabang di level DB (bukan klien); Auth +
audit + backup bawaan; migrasi terkecil dari `sharedStore` (bentuk JSON ≈ row).
Trade-off: lock-in vendor, residensi data luar (butuh persetujuan untuk PII),
batas free tier wajib diverifikasi ulang di dokumentasi resmi saat keputusan.
Fallback: B bila butuh kontrol penuh/on-premise. C hanya bila MySQL dimandatkan
(keputusan CI4/MySQL sebelumnya DIBATALKAN — tidak otomatis berlaku).
Tanpa instalasi/akun yang dibuat tahap ini.
