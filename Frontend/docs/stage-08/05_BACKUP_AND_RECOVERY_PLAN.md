# 05 — Rencana Backup & Recovery (tanpa baca data pengguna)

1. Snapshot source: backup zip per tahap (berlaku) + Git WAJIB sebelum B0 (saat ini NOT READY).
2. Data demo: ekspor eksplisit dari seed (`sharedStore.seed()`), BUKAN dari localStorage
   pengguna — dilarang membaca/mengekspor/mengimpor profil pengguna otomatis.
3. Seed vs pengguna: flag `is_demo`; data pengguna tidak ada (prototype lokal).
4. Validasi impor: count per tabel, checksum omzet Selesai, saldo = Σ movement, idem-key unik.
5. Rollback: restore dump + flag baca ke localStorage; RPO/RTO menunggu keputusan (#14).
6. Prototype lama tetap jalan (:5173) selama migrasi; migrasi otomatis TANPA persetujuan dilarang.
7. Catatan paket: Free TANPA backup otomatis → dump manual terjadwal; Pro daily 7 hari.
