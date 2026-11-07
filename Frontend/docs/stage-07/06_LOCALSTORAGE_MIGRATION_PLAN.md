# 06 — Rencana Migrasi localStorage → Relasional (tanpa baca data pengguna)

Prinsip: migrasi HANYA dari seed/export eksplisit; DILARANG membaca/mengimpor
`localStorage` pengguna otomatis; tidak semua isi localStorage = produksi.

1. Inventarisasi: field per entitas (`01_*`); tandai demo vs valid (seed = demo).
2. Normalisasi: tanggal string-ID → timestamptz; rupiah → integer; snapshot tetap snapshot.
3. Dedup ID: prefix per entitas + UNIQUE; konflik → quarantine table, tanpa overwrite.
4. Referensi: products→stocks→requests→distributions→receipts→movements; PO→items/
   timeline/snapshot; transactions→items; orphan → quarantine + laporan.
5. Backup: dump DB tujuan + snapshot JSON seed SEBELUM import; rollback = restore dump.
6. Import ke staging → verifikasi: count per tabel, checksum total transaksi Selesai,
   saldo = Σ movement per (branch,product), tanpa idem-key ganda.
7. Cutover: feature flag baca (localStorage → API) per modul + fallback; rollback = flag off.
8. Proteksi pengguna: data browser pengguna tidak tersentuh; migrasi produksi hanya dari
   sumber yang disahkan tertulis.
