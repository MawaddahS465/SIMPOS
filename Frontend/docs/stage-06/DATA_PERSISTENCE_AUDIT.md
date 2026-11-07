# DATA_PERSISTENCE_AUDIT (objektif, 12 Okt 2026)

## Mekanisme aktual

- Satu-satunya persistence: `localStorage` kunci `simpos.shared.v2` (state) +
  `simpos.session` (sesi). Ditulis setiap perubahan state; dibaca saat boot + backfill.
- Backend/database persisten: **tidak ada**. Supabase: **tidak digunakan**.

## Perilaku teruji

- Refresh: data bertahan (S13, INT-20, CP2-25 PASS). Restart browser: bertahan selama
  profil localStorage utuh. Idempotency keys (`saleRefs`, `allocKeys`,
  `distribution::product`) mencegah ganda saat retry/reload.
- Konsistensi antar-modul: pelanggan, resep (snapshot per-PO), katalog, stok/cabang,
  PO, transaksi, pembayaran (label), pengajuan, alokasi, penerimaan, mutasi, laporan —
  semua dari satu store; perubahan satu role terbaca role lain (teruji lintas suite).

## Keterbatasan (jujur)

- Satu browser = satu database. Perangkat/browser berbeda TIDAK sinkron.
- Kapasitas ~5 MB; tanpa backup otomatis (ekspor XLSX/PDF = arsip manual).
- Tanpa transaksi atomik server; konkurensi paralel tidak aman (clamp + idempotency
  hanya jaring pengaman demo). Hapus profil/browser = data hilang.
