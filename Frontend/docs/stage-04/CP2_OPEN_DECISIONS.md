# CP2 — Open Decisions (bukan kebijakan resmi)

1. **Debit stok pusat**: saat ini TIDAK dikurangi di tahap mana pun (alokasi = reservasi
   komitmen). Rekomendasi: kurangi `on_hand` saat dispatch sah / terima, setelah disetujui.
2. **Dispatch/in-transit**: tanpa tahap kirim; status hanya Menunggu/Diterima (Sebagian).
   Rekomendasi: peran pencatat dispatch + event `DISPATCH` bila disetujui (CP2-15 BLOCKED).
3. **Selisih/parsial/rusak/hilang**: terekam (`selisih`, status Sebagian); penyelesaian
   butuh aturan (retur, klaim, revisi alokasi).
4. **Penolakan/pembatalan pengajuan & alokasi**: tanpa tombol; hanya outstanding menurun
   via alokasi. Butuh: siapa boleh batal + efek ke reservasi.
5. **Satu bukti per baris distribusi**: penerimaan bertahap lintas bukti butuh kebijakan
   penerimaan parsial resmi (saat ini 1 baris = 1 kunci).
6. **Konkuren multi-pemilik & RBAC server**: DEMO_ONLY (single-thread + klien).
7. Diwarisi: PO Selesai, master global/per-cabang, approval workflow, gateway, cabang kedua.
