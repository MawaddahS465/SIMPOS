# 03 — Database MySQL: ERD, Migration, Seeder

Engine InnoDB, `utf8mb4`. Uang `INT` (rupiah), qty `INT`, status `ENUM/VARCHAR(32)`,
waktu `DATETIME`, idempotency `VARCHAR(191) UNIQUE`.

## ERD (tekstual)

```
branches(1)──< users, products_stock(via branch_stocks), stock_requests,
               distributions, receipts, mutations, pos, transactions
products(1)──< branch_stocks, central_stocks, stock_requests, distribution_lines,
               receipt_lines?, mutations, po_items, sale_items
stock_requests(1)──< distributions(request_id NULLABLE)
distributions(1)──< distribution_lines ──< receipts(distribution_id)
users(N)──< transactions(cashier), receipts(actor), distributions(actor)
pos(1)──< po_items + po_timelines; customers(1)──< pos + prescriptions
transactions(1)──< sale_items; transactions.idem_key UNIQUE
```

## Tabel inti (ringkas)

- `branches(id, name, type ENUM(Pusat,Cabang), is_active)`
- `users(id, name, email UNIQUE, password_hash, role ENUM, branch_id NULLABLE→all owner)`
- `products(id, code UNIQUE, name, brand, type, category, price INT, status, tag?)`
- `branch_stocks(branch_id, product_id, saldo INT DEFAULT 0, minimum, UNIQUE(branch,product), CHECK(saldo>=0))`
- `central_stocks(product_id PK, saldo, minimum)`
- `stock_requests(id, branch_id, product_id, qty, note, status, actor, created_at)`
- `distributions(id, from_loc, branch_id, request_id NULLABLE, status, actor, note, idem_key UNIQUE, created_at)` + `distribution_lines(distribution_id, product_id, qty_alokasi, qty_diterima)`
- `receipts(id, distribution_id, product_id, qty, selisih, actor, idem_key UNIQUE, created_at)`
- `stock_movements(id, branch_id, product_id, arah, sumber, qty_signed, sebelum, sesudah, ref, actor, created_at, UNIQUE(event_key))`
- `pos(id, branch_id, customer_id, status, note, created_by, created_at)` + `po_items` + `po_timelines` + `po_resep_snapshot(po_id PK, od_*, os_*, pd, add, at)`
- `transactions(id/no UNIQUE, branch_id, customer, total INT, method, status, idem_key UNIQUE, created_at)` + `sale_items`
- `audit_logs(id, at, actor, role, branch, action, ref)`

## Migration & seeder (CI4 `spark make:migration/seeder`)

Urutan: branches → users → products → stocks → requests/distributions/receipts →
mutations → customers/prescriptions → pos → transactions. Seeder memuat **data demo
persis seed prototype** (9 produk, saldo awal, DIST/REQ/PO/TRX contoh) + 3 akun demo
(hash `password_hash`, bukan plaintext). Rollback: `spark migrate:rollback` per batch.
