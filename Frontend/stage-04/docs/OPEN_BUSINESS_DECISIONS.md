# KEPUTUSAN BISNIS YANG PERLU DISETUJUI

Jangan menjadikan rekomendasi teknis di bawah sebagai kebijakan operasional resmi tanpa konfirmasi pengguna/klien.

| Isu | Belum ditetapkan pada sumber | Sikap implementasi sementara |
|---|---|---|
| Master cabang dan pengguna | Siapa boleh tambah/edit cabang dan akun role? | Monitoring saja; tidak buat fitur CRUD. |
| Persetujuan pengajuan | Apakah Owner boleh approve/reject, beri komentar, status apa saja? | Tinjau dan buat alokasi, hindari fitur persetujuan baru. |
| Stok pusat | Dikurangi saat alokasi, pengiriman, atau penerimaan? | Jangan mengubah saldo tanpa kebijakan; catat allocation event dan tandai blocker saldo/in-transit. |
| Barang dalam perjalanan | Bagaimana status in-transit, selisih barang diterima, batal distribusi? | Tampilkan status jelas jika existing; jangan auto-reconcile. |
| Status PO Selesai | Peran Admin atau Kasir yang menandai selesai? | Pertahankan keputusan Tahap 03; jika belum ada, jangan ubah lifecycle. |
| Pembayaran | DP, refund, pembayaran parsial, settlement/fee gateway? | Hanya tampilkan data/status nyata yang didukung implementasi. |
| Profit/margin | HPP dan rumus laba per cabang? | Jangan menghitung profit tanpa data biaya. |
| Report template | Standar kolom, header, jumlah, format resmi? | Buat template awal untuk QA, minta persetujuan desain final. |

**Sumber:** PRD Pemilik v1.0 (10 Okt 2026) dan dokumen analisis SIMPOS. Prioritas teknis di master prompt adalah pengembangan/rekomendasi dan bukan pengesahan oleh klien.
