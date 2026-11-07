# 05 — Change Impact & Backlog (dieksekusi SETELAH approval)

Urutan dependensi: #14 backend/RBAC → #13 akun → #6 approval → #1 PO-Selesai →
#2/#3 pusat-dispatch → #4 selisih → #5 batal → #8 stok-PO → #7 master → #10 laporan →
#11/#12 kas → #9 cabang-2.

| Batch | Item | File/module terdampak | Migrasi | Flag | Uji negatif |
|---|---|---|---|---|---|
| A. Fondasi | #14, #13 | `session.ts`, guard, modul akun baru | sesi server, tabel users | `auth_v2` | forged role, expired, 403 |
| B. Alur inti | #1, #6, #5 | `transitionPO`, tombol Kasir, status request, tombol batal | tambah status/timeline | `po_finish`, `req_reject` | lompat status, batal ganda |
| C. Stok | #2, #3, #4, #8 | `centralStock`, event DISPATCH/KOREKSI/RETUR, reserve PO | mutasi pusat + in-transit | `dispatch_flow` | debit ganda, selisih tanpa review |
| D. Data | #7, #9 | kolom scope produk/harga, `BRANCHES` + seed | backfill non-destruktif | `branch_2` | harga histori berubah |
| E. Uang/lapor | #10, #11, #12 | template ekspor, lifecycle payment, modul biaya | versi template; tabel biaya | `refund_flow` | total ≠ tampilan |
| F. UAT | semua | suites + screenshot | — | — | 99/99 + baru hijau |

Estimasi & owner backlog: diisi setelah approval (dilarang mengarang komitmen).
