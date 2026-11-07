# 04 — Backend CI4: Models, Controllers, Services, Routes, Auth

## Models (`app/Models/`, Entity + Validation)

`BranchModel, UserModel, ProductModel, BranchStockModel, CentralStockModel,
StockRequestModel, DistributionModel (+Lines), ReceiptModel, StockMovementModel,
PoModel (+Items/Timelines/Snapshot), TransactionModel (+Items), AuditModel`.
Rules: integer>0 qty/harga, `is_unique` kode/email/idem keys, `CHECK` non-negatif di DB.

## Services (`app/Libraries/` — logika atomik + idempotency, mirror store)

`StockService::availableToAllocate()` (= on_hand − reserved outstanding);
`AllocationService::create()` (validasi outstanding+available, cek idem_key, insert
distribution+lines+audit dalam **transaksi DB**); `ReceiptService::confirm()`
(kunci `distribution::product`, update stok+mutasi+status sekali);
`SaleService::record()` (kunci no. struk, clamp ≥0); `PoService::transition()`
(state machine Dipesan→Diproses→Datang; Selesai diblokir); `ReportService` (query =
sumber tampilan & ekspor).

## Controllers + Routes (`app/Config/Routes.php`, grup filter)

- `Auth` (login 3 role, session + `role`, `branch_id`; `is_admin/is_owner/is_kasir` filters;
  owner `branch_id=all`).
- `Cashier`, `Admin`, `Owner`, `Po`, `Report` (termasuk `export/xlsx|pdf`).
- Filter: `auth` (sesi), `role:kasir|admin|pemilik`, `branch` (tolak lintas-cabang, 403),
  `csrf` untuk semua POST. Session: driver database, regenerate ID saat login,
  timeout idle; password `password_hash`/`verify`.
