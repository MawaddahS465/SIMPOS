# UAT SCENARIOS — proses bisnis Optik Mekar Jaya (teknis internal)

Alur 16 langkah terotomasi di `qa/final/test_uat_final.py` (14/14 PASS):
beli frame → bayar → stok−1 → Owner pantau → buat PO → Admin proses → Kasir pantau →
ajukan stok → Owner tinjau → Owner alokasi → Admin terima → stok+n → mutasi →
laporan → ekspor XLSX. Negatif: over-stock, lompat-Selesai, guard peran, forged cabang.

## Formulir persetujuan klien (wajib sebelum production)

> Saya, perwakilan Optik Mekar Jaya, telah meninjau demo SIMPOS (Kasir, Admin Cabang,
> Pemilik) pada tanggal ____. Hasil UAT teknis internal BUKAN persetujuan saya.
> Keputusan bisnis terbuka (14 item) [ ] sudah dibahas [ ] disetujui sebagian [ ] belum.
> Visual & alur dinyatakan: [ ] disetujui [ ] revisi (catatan: ____).
> Nama/jabatan/tanda tangan: ____.

Daftar keputusan terbuka: `docs/final/OPEN_BUSINESS_DECISIONS.md`.
