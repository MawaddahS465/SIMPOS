# CP3 — Implementation Log

## File baru

- `src/store/reports.ts` — parser tanggal ID, preset periode inklusif, builder XLSX (`xlsx`)
  + PDF (`jspdf`, tabel manual), uang integer.
- `src/pages/owner/OwnerTransaksiPage.tsx` — filter cabang/periode/status/metode + cari +
  pagination + drawer detail read-only + ringkasan sukses.
- `src/pages/owner/OwnerPOPage.tsx` — filter + ringkasan 4 status + drawer read-only
  (snapshot resep hanya "terlampir", tanpa nilai — kewenangan minim).
- `src/pages/owner/OwnerLaporanPage.tsx` — 4 tab (Transaksi/Stok/PO/Aktivitas), filter
  cabang/jenis/periode, pagination, ekspor PDF+XLSX seluruh baris filter + notifikasi file.

## File diubah (tanpa sentuh visual lama)

- `src/data/mock.ts`: `Transaction.method?` (aditif).
- `src/store/sharedStore.tsx`: `recordSale(..., method?)` → tersimpan di transaksi.
- `src/pages/CheckoutPage.tsx`: teruskan `receipt.method` (satu argumen).
- `src/data/owner.ts` + `src/App.tsx`: 3 menu/rute aktif.
- `OwnerTransaksiPage/OwnerPOPage`: opsi "Pusat" di filter cabang (empty state jujur).
- `package.json`: `xlsx`, `jspdf` (ekspor klien).

## Kontrak dijaga

Sumber tetap `sharedStore`; tidak ada store Owner terpisah; tidak ada reset/migrasi
destruktif; metode transaksi lama = "—" (tidak difabrikasi); alokasi = reservasi
(bukan barang diterima) di laporan aktivitas; kebijakan terbuka CP2 tidak diubah.
