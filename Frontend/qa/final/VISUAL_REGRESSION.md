# VISUAL REGRESSION — final (66 screenshot aktual)

Aset: `qa/final/screenshots/{desktop,tablet,mobile}/` — 22 halaman × 3 viewport,
**0 horizontal overflow** di semua viewport (cek `scrollWidth` otomatis).

## Diff vs baseline (mean-diff piksel)

| Halaman | Diff | Status |
|---|---|---|
| Dashboard Kasir, PO Kasir, Stok/Admin, Dashboard Admin/Owner, Stok/Transaksi/PO/Laporan Owner | 0.00 | identik |
| Pengajuan/Alokasi/Mutasi Owner | 0.22–0.81 | area sidebar menu yang sah diaktifkan + baris data dinamis |

Semua dalam toleransi; tidak ada redesign (satu-satunya edit visual CP4: kolom ID mutasi).
Design lock dipatuhi: tanpa perubahan login/dashboard/sidebar/tokens/typography.
