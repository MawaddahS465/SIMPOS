# 05 — Transaksi Atomik & Konkurensi (PROPOSED)

Boundary per aksi (satu transaksi DB, rollback total bila gagal):

1. **Checkout**: verifikasi stok → lock baris (`SELECT FOR UPDATE` / serialisasi fungsi) →
   insert sale+items+idempotency → decrement + movement OUT → commit. Gagal bayar =
   tanpa write. Retry ref sama → kembalikan record lama.
2. **PO**: create (snapshot resep disalin, bukan FK hidup) → transisi tervalidasi
   (Dipesan→Diproses→Datang; Selesai TERKUNCI menunggu #1).
3. **Request→alokasi**: cek outstanding + `available=onHand−reserved` dalam transaksi;
   idem key per form; oversubscribe serial → satu menang (UNIQUE + cek ulang).
4. **Receipt**: kunci `distribution::product`; tolak duplikat/over-alokasi; +stok cabang,
   movement IN, status distribusi — sekali commit. Selisih → status Sebagian + catatan
   (penyelesaian menunggu #4).
5. **Laporan**: agregat dari tabel final (Selesai saja untuk omzet); ekspor = snapshot
   query sama + metadata filter.

BLOCKED (tanpa kebijakan): dispatch/in-transit, debit pusat, pembatalan, refund/DP,
stok-PO. Bagian termigrasi aman: seluruh perilaku prototype; bagian tertunda eksplisit
di tiap fungsi sebagai `RAISE ..._requires_policy`.
