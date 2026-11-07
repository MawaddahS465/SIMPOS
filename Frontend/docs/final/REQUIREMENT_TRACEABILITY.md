# REQUIREMENT TRACEABILITY (PRD → implementasi → bukti)

## Kasir (PRD Kasir)

| Kebutuhan | Implementasi | Bukti |
|---|---|---|
| Login role/cabang | `LoginPage` + sesi + `KasirGuard` | INT-01/19 |
| Katalog cabang (baca) | `TransaksiBaruPage` ← shared | INT-05/06 |
| Pelanggan & resep | `customers.ts`, drawer checkout | U1-U4 |
| Buat PO + snapshot | `createPO` + drawer | INT-07, U6-U8 |
| Checkout + bayar + stok −1 | `recordSale`, verifikasi stok | INT-12/13/15, NEG-1 |
| Riwayat/nota | `RiwayatPage` ← shared | INT-10c |

## Admin Cabang (PRD Admin)

| Kebutuhan | Implementasi | Bukti |
|---|---|---|
| CRUD frame/lensa + soft-delete | `AdminProdukPage` | INT-05/06 |
| Stok + minimum + menipis | `AdminStokPage` (saldo≤min) | UAT-02, INT-16 |
| Penerimaan idempoten | `confirmReceipt` + dialog | INT-10/11, CP2-16/17 |
| Pengajuan (tanpa ubah stok) | `createRequest` | INT-17, CP2-01/03 |
| PO Dipesan→Diproses→Datang | `transitionPO` + timeline | INT-08 |
| Mutasi read-only | `AdminMutasiPage` | CP2-21 |

## Pemilik (PRD Pemilik OWN-01..12)

| Kebutuhan | Implementasi | Bukti |
|---|---|---|
| OWN-01 login lintas cabang | `OwnerLoginPage`, role pemilik | T04-01 |
| OWN-02 dashboard konsolidasi | angka real + filter | T04-03, CP2-31 |
| OWN-03 monitoring cabang | list + detail | T04-03, CP2-32 |
| OWN-04 stok lintas lokasi | pusat+cabang, read-only | CP2-32 |
| OWN-05 pengajuan | antrean + detail + notifikasi mock | T04-06, CP2-01 |
| OWN-06 alokasi | `createAllocation`, reservation | CP2-06/07/09/14 |
| OWN-07 penerimaan+mutasi | ledger gabungan + trace | CP2-21, U12-U14 |
| OWN-08/09 monitoring trx/PO | read-only + filter | S1-S6 |
| OWN-11/12 laporan + ekspor | 4 tab + XLSX/PDF valid | S11/S12 |

Konflik redaksional PO Selesai → `NEEDS_CLIENT_APPROVAL` (dipertahankan semua tahap).
