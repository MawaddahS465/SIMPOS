# OPEN BUSINESS DECISIONS — konsolidasi final (bukan kebijakan resmi)

1. PO `Selesai`: siapa menandai (Admin/Kasir) — sementara: Admin diblokir, Kasir disabled + tag.
2. Debit stok pusat: tidak dikurangi di tahap mana pun (alokasi = reservasi).
3. Dispatch/in-transit: tanpa tahap kirim; status hanya Menunggu/Diterima (Sebagian).
4. Selisih/parsial/rusak/hilang/retur: terekam, tanpa aturan penyelesaian.
5. Penolakan/pembatalan pengajuan & alokasi: tanpa tombol; 1 baris distribusi = 1 bukti.
6. Approval workflow pengajuan: hanya status Diajukan + mock notifikasi.
7. Master global vs per-cabang: satu master + `branchId` per baris (siap dua arah).
8. Stok pesanan PO khusus vs reguler: PO tidak mereservasi stok.
9. Cabang kedua (Bukittinggi): belum ada data (hanya opsi teks login Kasir).
10. Template laporan + ekspor-semua-baris: usulan QA, perlu pengesahan.
11. Refund/DP/parsial/fee gateway/settlement: tak ada di data.
12. HPP/margin/laba: tidak dihitung (tanpa data biaya).
13. Manajemen akun/cabang/role oleh Owner: tanpa CRUD (di luar hak disetujui).
14. Stack backend, HTTPS, backup/RPO, SLA: menunggu keputusan (lihat DEPLOYMENT_READINESS).
