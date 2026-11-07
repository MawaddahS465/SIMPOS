# STAGE 03 — Cross-Role Test Matrix (hasil aktual)

Runner: `qa/stage-03/test_cross_role.py` (Playwright, profil bersih). **33/33 PASS**, 0 `pageerror`.

| ID | Kasus | Bukti |
|---|---|---|
| INT-01 | Login Kasir/Admin → dashboard + menu sesuai | URL + teks sidebar |
| INT-02 | Kasir → `/admin/stok` | redirect `/admin/login` |
| INT-03 | Admin → `/checkout` | redirect `/login` |
| INT-04 | Sesi `branchId` asing | ditolak ke login (server: BLOCKED) |
| INT-05 | Admin tambah frame Rp 250.000 | tampil di katalog Kasir |
| INT-06 | Harga → Rp 275.000; histori utuh | katalog berubah, 9 total lama sama |
| INT-07 | Kasir buat PO lensa | Dipesan + snapshot OD −1.50; terlihat di antrean Admin |
| INT-08 | Admin → Sudah Datang | timeline 3; Kasir pantau status baru |
| INT-09 | Snapshot resep | per-PO read-only + `at` |
| INT-10 | Terima 3 (P-008) | 3→6, 1 mutasi IN `Penerimaan` |
| INT-11 | Retry penerimaan identik | stok tetap 6 + pesan duplikat |
| INT-12 | Kasir jual 2 (P-002) | 6→4, 1 mutasi OUT `Penjualan` |
| INT-13 | Retry `recordSale` ref sama | `false`, stok tetap |
| INT-14 | Tanpa success tanpa mutasi | jumlah mutasi tetap |
| INT-15 | Klaim 999 (stok 9) | clamp 0, deduct −9, 1 mutasi |
| INT-16 | Stok ≤ minimum | 5 produk berlabel Menipis |
| INT-17 | Pengajuan 10 | tercatat + stok identik |
| INT-18 | PO Sudah Datang di Kasir | tombol disabled + `NEEDS CLIENT APPROVAL` |
| INT-19 | Logout/refresh/direct URL | sesi dihapus; guard benar; data menetap |
| INT-20 | Reload | requests tetap 1 |
| INT-21 | Over-alokasi 99 (sisa 4) | ditolak; mutasi tetap |
| INT-22 | PO id asing; guard | fallback aman; kasir tetap ditolak |
| INT-23 | Regresi Kasir | 13 desktop + 13 mobile + 2 tablet, 0 overflow |
| INT-24 | Regresi Admin | termasuk di atas; shell identik |

BLOCKED jujur: RBAC server, multi-perangkat, gateway nyata, konkurensi 2-kasir paralel
(dilindungi clamp non-negatif sebagai jaring pengaman demo).
