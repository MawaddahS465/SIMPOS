# ADMIN TAHAP 02 — UAT (hasil aktual, 11 Okt 2026)

Pelaksana: Playwright Chromium otomatis (`uat_stage02.py`) + cek reload (`cap_stage02.py`).
Lingkungan: `npm run dev` (Vite), profil browser bersih, `localStorage` sebagai persistence demo.

## Hasil

| ID | Skenario | Expected | Actual | Status |
|---|---|---|---|---|
| UAT-01 | Admin A akses data cabang B | Ditolak | N/A frontend — scope `branchId` di semua query/aksi; RBAC server wajib saat backend ada | SKIP (terdokumentasi) |
| UAT-02a | Saldo ≤ minimum | Label Stok Menipis | 3 produk (FR-003 2/3, FR-005 4/4, LS-008 3/3) berlabel | PASS |
| UAT-02b | Saldo > minimum | Tanpa label | 6 produk aman | PASS |
| UAT-03a | Pengajuan qty 5 | Stok tidak berubah | Saldo identik sebelum/sesudah | PASS |
| UAT-03b | Pengajuan tercatat | Riwayat + ID/status | `REQ-…` status Diajukan tampil di tabel | PASS |
| UAT-03c | Notifikasi Pemilik | Terhubung ke store sama | 1 entri antrean mock `notices` | PASS (simulasi) |
| UAT-04 | Ubah `qty_alokasi` | Ditolak / read-only | Alokasi dirender sebagai teks + badge "read-only"; tidak ada input/aksi edit di store | PASS |
| UAT-05a | Penerimaan qty 2 (sisa 3) | Stok +2 tepat sekali | 4 → 6 | PASS |
| UAT-05b | Mutasi IN | Tepat 1 mutasi | 1 mutasi IN qty +2, sebelum/sesudah benar | PASS |
| UAT-05c | Receipt tercatat | Anti-duplikat | 1 receipt; konfirmasi ulang baris sama diblokir pesan duplikat | PASS |
| UAT-06 | qty 0 / negatif / kosong | Ditolak + pesan | Validasi inline; qty > sisa alokasi ditolak eksplisit | PASS |
| UAT-07 | PO cabang A di Admin A | Tampil, ter-scope | Semua PO `branchId=cabang-padang`; guard cabang di store | PASS (satu cabang) |
| UAT-08a | Dipesan → Diproses | Tersimpan + timeline | Status + timeline 2 entri + audit | PASS |
| UAT-08b | Kasir baca status baru | Sama dari sumber sama | Detail PO Kasir tampil "Diproses" | PASS |
| UAT-08c | Lompat tahap / ke Selesai | Ditolak | `transitionPO` menolak + tombol Selesai tidak dirender (keputusan PRD terbuka) | PASS |
| UAT-09 | Snapshot resep | Tak berubah | Snapshot per-PO (read-only); tidak ada fitur edit resep di scope Admin | PASS (struktural) |
| UAT-10a | Jual Kasir qty 2 | Stok −2 sekali | 8 → 6 | PASS |
| UAT-10b | Mutasi OUT | Tepat 1 | 1 mutasi OUT qty −2 | PASS |
| UAT-10c | Riwayat Kasir | Trx baru Selesai | `TRX-…` di baris teratas riwayat | PASS |
| UAT-11 | Refresh pasca-submit | Data menetap | 1 request tetap ada setelah reload | PASS |
| UAT-12 | Regresi | Tanpa error | 0 `pageerror` di 7 rute Kasir+Admin | PASS |

## Catatan

- UAT-01 & RBAC server: tidak dapat diuji di prototype; seluruh state berlabel demo.
- Over-delivery/selisih penerimaan: ditolak dengan pesan "butuh keputusan bisnis" (bukan auto-approve).
- Stok negatif: `recordSale` clamp di 0 (tidak boleh negatif, B-bisnis).
