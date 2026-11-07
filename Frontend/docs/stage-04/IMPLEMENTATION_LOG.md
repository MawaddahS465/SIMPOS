# STAGE 04 — Implementation Log (Checkpoint 1: O01–O04)

## Perubahan (aditif; nol perubahan visual Kasir/Admin)

- `src/store/session.ts`: role `pemilik`, `branchId "all"`, `DEMO_OWNER`, `ownerSession()`.
- `src/store/sharedStore.tsx`: `BRANCHES` (Pusat + Padang), `centralStock` seed + backfill
  (key `simpos.shared.v2` dipertahankan), `branchId` pada transaksi baru + backfill.
- `src/data/mock.ts`: `Transaction.branchId?` opsional (tanpa efek render).
- Baru: `OwnerGuard`, `OwnerLayout`, `data/owner.ts`, `OwnerLoginPage`,
  `OwnerDashboardPage` (+`useOwnerScope`), `OwnerCabangPage`, `OwnerCabangDetailPage`,
  `OwnerStokPage`; rute `/owner/login|dashboard|cabang|cabang/:id|stok` di `App.tsx`.
- Menu CP2+ (Pengajuan, Alokasi, Mutasi, Transaksi, PO, Laporan) tampil nonaktif "Berikutnya".

## Keputusan desain

Angka Owner = selektor atas store sama (bukan dasbor duplikat); filter Semua/Pusat/Padang;
Pusat bukan cabang penjualan (empty state jujur); penyesuaian stok bukan hak Owner;
cabang kedua (Bukittinggi) tetap terbuka; kebijakan stok pusat/in-transit tetap terbuka.

## Uji CP1: 9/9 PASS (`qa/stage-04/test_owner_cp1.py`); typecheck bersih.
