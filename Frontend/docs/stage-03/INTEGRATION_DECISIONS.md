# STAGE 03 — Integration Decisions (terbuka = belum diputuskan klien)

1. **Siapa menandai PO `Selesai`** — konflik PRD. Sementara: Admin diblokir, Kasir disabled +
   tag `NEEDS_CLIENT_APPROVAL`. Seed histori Selesai memakai aktor Kasir (ilustrasi bentuk).
2. **Pengurangan stok pusat / in-transit** — prototype hanya menambah stok cabang saat terima
   (banner di Distribusi). Perlu keputusan: alokasi / kirim / terima.
3. **Selisih & over-delivery penerimaan** — ditolak eksplisit ("butuh keputusan bisnis"),
   tanpa auto-approve. Perlu aturan: toleransi, retur, koreksi.
4. **Approval pengajuan** — status hanya `Diajukan`; notifikasi = mock queue. Perlu workflow Pemilik.
5. **Master global vs per-cabang** — implementasi: satu master + `branchId` di tiap baris (siap dua arah).
6. **Stok pesanan PO khusus vs reguler** — PO tidak mereservasi/mengurangi stok (PRD tak mengatur
   reservasi/DP; tidak diasumsikan). Perlu aturan saat pelunasan PO.
7. **Satu bukti per baris distribusi** — penerimaan parsial bertahap butuh distribusi lanjutan
   (kunci idempotency `distribution::product`). Perlu kebijakan penerimaan parsial resmi.
8. **Backend/RBAC server/gateway** — BLOCKED sampai backend ada; klaim integrasi = satu browser demo.
