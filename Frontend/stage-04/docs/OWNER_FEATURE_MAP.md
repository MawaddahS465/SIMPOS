# OWNER FEATURE MAP — Berdasarkan PRD Pemilik v1.0

| Kode | Layar | Kebutuhan utama | Hak Owner |
|---|---|---|---|
| O01 | Login | Email/password, redirect role | Login |
| O02 | Dashboard | Ringkasan seluruh cabang, stok, transaksi/PO/permintaan | Baca |
| O03 | Monitoring Cabang | Pilih cabang, ringkasan dan detail | Baca |
| O04 | Stok Lintas Lokasi | Frame, lensa, pusat, cabang, stok minimum | Baca |
| O05 | Pengajuan Barang | Daftar pengajuan dari Admin | Tinjau |
| O06 | Alokasi Distribusi | Tentukan jumlah alokasi pusat ke cabang | Tulis alokasi |
| O07 | Mutasi & Distribusi | Riwayat masuk/keluar dan jejak mutasi | Baca |
| O08 | Transaksi & Pembayaran | Detail/rekap transaksi Kasir | Baca |
| O09 | Monitoring PO | Keempat status, rincian tiap cabang | Baca |
| O10 | Laporan & Ekspor | Filter dan ekspor XLSX/PDF | Baca/ekspor |

## Perbedaan dengan Admin dan Kasir
- Owner **tidak** menginput transaksi, mengedit resep, memproses pembayaran, atau mengubah status PO.
- Owner **tidak** mencatat barang diterima; itu kewenangan Admin Cabang.
- Owner **menentukan kuantitas alokasi pusat ke cabang** dan meninjau pengajuan Admin.
- Manajemen akun/cabang dan refund bukan scope yang secara eksplisit disetujui.

## Prioritas penampilan dashboard
Rancang minimalis: gunakan satu hero/heading kecil, 3–4 KPI bermakna, ringkasan pengajuan baru dan daftar singkat cabang. Jangan paksa grafik atau puluhan cards jika tidak diperlukan.

## Data kebenaran
Seluruh angka berasal dari data terintegrasi: produk, PO, barang diterima, transaksi berhasil, mutasi dan pengajuan. Summary harus bisa ditelusuri ke detail record.
