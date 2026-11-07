# MATRIKS UJI TAHAP 04 — KASIR × ADMIN CABANG × PEMILIK

**Perhatian:** Ini rancangan test, bukan hasil test yang sudah dieksekusi. Isi kolom Status saat OpenCode benar-benar menjalankan pengujian.

| ID | Skenario | Expected result | Status | Evidence |
|---|---|---|---|---|
| T04-01 | Login Owner | Redirect dashboard Owner | NOT_RUN | |
| T04-02 | Kasir/Admin akses Owner URL/API | 403/redirect, tidak baca data | NOT_RUN | |
| T04-03 | Owner ganti A → semua cabang | Filter dan agregat benar | NOT_RUN | |
| T04-04 | Admin A akses data cabang B | Ditolak | NOT_RUN | |
| T04-05 | Owner logout, pakai route privat | Ditolak | NOT_RUN | |
| T04-06 | Admin ajukan stok 10 | Owner melihat, saldo stok belum berubah | NOT_RUN | |
| T04-07 | Owner alokasi ke cabang A | Admin A melihat, Admin B tidak | NOT_RUN | |
| T04-08 | Owner alokasi lebih dari saldo tersedia | Validasi ditolak sesuai kebijakan pusat | NOT_RUN | |
| T04-09 | Double click alokasi | Tepat 1 event alokasi | NOT_RUN | |
| T04-10 | Admin terima barang 5 | Stok cabang +5 sekali, muncul mutasi | NOT_RUN | |
| T04-11 | Retry receipt identik | Tidak double-stock | NOT_RUN | |
| T04-12 | Mutasi stok pusat/in-transit | Sesuai policy; BLOCKED jika belum diputuskan | NOT_RUN | |
| T04-13 | Kasir B transaksi sukses | Owner agregat +1; hanya B terkait | NOT_RUN | |
| T04-14 | Pembayaran failed/pending | Tidak dihitung penjualan sukses | NOT_RUN | |
| T04-15 | Retry callback pembayaran | Tidak double sales/stock | NOT_RUN | |
| T04-16 | PO Kasir A → Admin A proses | Status terlihat Owner, readonly | NOT_RUN | |
| T04-17 | Owner filter Sudah Datang | Item/status/cabang benar | NOT_RUN | |
| T04-18 | Owner edit pembayaran/PO | Ditolak | NOT_RUN | |
| T04-19 | Filter cabang A vs semua | Agregasi tidak menduplikasi | NOT_RUN | |
| T04-20 | Tanggal awal/akhir inklusif | Record batas masuk sekali | NOT_RUN | |
| T04-21 | Ekspor XLSX | Baris dan total sama filter UI | NOT_RUN | |
| T04-22 | Ekspor PDF | Baris dan total sama filter UI | NOT_RUN | |
| T04-23 | Ekspor tanpa data | File valid dan pesan data kosong | NOT_RUN | |
| T04-24 | Pagination ratusan baris | Tidak kehilangan/menduplikasi data | NOT_RUN | |
| T04-25 | Kasir login/checkout/PO lama | Tidak regresi | NOT_RUN | |
| T04-26 | Admin produk/stok/receipt/PO lama | Tidak regresi | NOT_RUN | |
| T04-27 | Owner 1536×1024 dan 390×844 | UI utuh, tidak overflow viewport | NOT_RUN | |
| T04-28 | Screenshot Kasir/Admin baseline | Tidak ada visual regresi tidak disengaja | NOT_RUN | |

**Data uji yang disarankan:** Lokasi Pusat + cabang A dan B; satu item frame SKU F-001, stok pusat 12, cabang A 5, cabang B 2; minimum cabang A 5; Kasir A dan B, Admin A dan B, Owner; transaksi pending dan paid serta PO dalam keempat status. Data ini khusus seed TEST, bukan fakta bisnis.

**Kode status:** PASS / FAIL / BLOCKED / DEMO_ONLY / NOT_RUN. Catat commands, screenshots dan log untuk setiap bukti.
