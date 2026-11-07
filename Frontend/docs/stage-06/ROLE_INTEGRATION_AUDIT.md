# ROLE_INTEGRATION_AUDIT (12 Okt 2026)

Sumber bersama: `SharedProvider` di root; guard `KasirGuard/AdminGuard/OwnerGuard` +
sesi bersama (`kasir|cabang-padang`, `admin|cabang-padang`, `pemilik|all`).

| Jalur | Status | Bukti |
|---|---|---|
| Produk Admin → katalog Kasir (+harga) | OK | INT-05/06 |
| Checkout → stok −1 + mutasi + riwayat | OK | INT-12/13/15, NEG-1 |
| Kasir buat PO → antrean Admin → status kembali | OK | INT-07/08, U6-U8 |
| Pengajuan → alokasi (reservasi) → terima → mutasi | OK | CP2-01/06/16/17/19 |
| Monitoring + laporan Owner (+ekspor valid) | OK | S1-S6, S11/S12 |
| Penolakan lintas-role/cabang | OK | INT-02/03/04, NEG-3 |
| Snapshot resep tak berubah | OK | INT-09 |

Batas: penegakan level klien (DEMO_ONLY); cabang kedua belum ada data;
14 PENDING tidak diterapkan.
