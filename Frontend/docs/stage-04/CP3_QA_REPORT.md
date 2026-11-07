# CP3 — QA Report (hasil aktual)

Runner: `qa/stage-04/test_owner_cp3.py` → **14/14 PASS**, 0 pageerror.
Baseline pasca-CP3: stage-03 **33/33**, CP1 **9/9**, CP2 **29/29**, typecheck bersih.
Screenshot: `qa/stage-04/cp3/{desktop (6), mobile (3), tablet (3)}` — 0 overflow.

| ID | Status | Bukti |
|---|---|---|
| S1 | PASS | TRX baru Kasir tampil di monitoring Owner |
| S2 | PASS | n=7, total 6.870.000 = transaksi Selesai |
| S3 | PASS | filter Pusat kosong jujur; Semua tampil |
| S4 | PASS | custom Okt-2026 tampil; Agu tersaring |
| S5/S6 | PASS | PO baru + "Diproses" tercermin |
| S7 | PASS | tanpa kata Simpan/Hapus/Ubah di 3 halaman |
| S8 | PASS | alokasi terbuka DIST-2026-021 tanpa efek stok |
| S9 | PASS | penerimaan P-003 +1 tepat sekali |
| S10 | PASS | ledger konsisten |
| S11 | PASS | XLSX dibuka openpyxl: 10 baris, total 6.870.000 cocok |
| S12 | PASS | PDF dibaca pypdf: 1 hal, total cocok |
| S13 | PASS | counts utuh pasca-reload |
| S14 | PASS | 33/33 + 9/9 + 29/29 di atas |
| S-ERR | PASS | 0 pageerror |

Regresi visual: owner-dashboard 0.00, kasir-pemesanan 0.00, owner-pengajuan 0.22
(seluruhnya area sidebar menu yang sah diaktifkan — bukan regresi).
Ekspor kosong: empty-state terdokumentasi di UI; file tetap berheader + keterangan.
