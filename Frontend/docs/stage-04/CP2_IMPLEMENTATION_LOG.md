# CP2 — Implementation Log

## File diubah/dibuat (aditif; desain CP1/Kasir/Admin terkunci)

- `src/store/sharedStore.tsx`: `Distribution{requestId?,actor?,note?,idemKey?}`,
  `allocKeys[]` (+seed/backfill), `availableToAllocate / allocatedForRequest /
  outstandingForRequest / createAllocation` (+hook uji). Key store tetap v2.
- Baru: `OwnerPengajuanPage`, `OwnerAlokasiPage` (form + idempotency key + busy),
  `OwnerMutasiPage` (ledger gabungan + telusur rantai); rute + menu `ready:true`.
- Validasi diketatkan: `AdminPengajuanPage`, `OwnerAlokasiPage`, `PemesananPage`
  (drawer Kasir), `AdminPenerimaanPage` — regex `/^[0-9]+$/` + pesan.
- Uji: `qa/stage-04/test_owner_cp2.py` (29/29). Screenshot `qa/stage-04/cp2/`.

## Arsitektur & kontrak

Alokasi = `Distribution` baru (sumber `Pusat`, tujuan cabang, 1+ lines) + `allocKeys`.
`available = onHand_pusat − reserved_outstanding` (derivasi, tanpa angka turunan tersimpan).
Outstanding request = `diminta − Σalokasi`. Penerimaan Admin tak berubah (membaca
distributions) — alokasi Owner otomatis muncul. Ledger Owner = mutations fisik +
event workflow berlabel (tanpa baris saldo palsu). Telusur: request→alokasi→receipt→mutasi.

## Workflow

Admin ajukan → Owner tinjau (detail: stok cabang/min, stok pusat, alokasi terkait) →
Owner alokasi (validasi outstanding + available + idempotency) → Admin terima
(konfirmasi sebelum/sesudah, anti-duplikat) → mutasi IN sekali → ledger 3 role sama.
