# 03 — Matriks RLS Konseptual (SELECT/INSERT/UPDATE/DELETE × role)

Prinsip: default-deny; klaim cabang dari JWT (`app.branch_id`), owner `all`;
tulis stok/uang HANYA via server function. S=SELECT, I=INSERT, U=UPDATE, D=DELETE.

| Tabel | anon | kasir (cabang) | admin (cabang) | owner (all) |
|---|---|---|---|---|
| branches, products (aktif) | — | S | S | S |
| branch_stocks, central_stocks | — | S | S | S |
| customers, prescriptions | — | S/I/U-cabang | — (PO read) | agregat minim |
| purchase_orders/po_* | — | S/I-cabang, U via fn | S/U-status via fn | S |
| transactions/sale_items | — | S/I via fn | — | S |
| stock_requests | — | — | S/I-cabang | S |
| distributions/lines | — | — | S-cabang | S/I via fn |
| receipts | — | — | S/I-cabang via fn | S |
| stock_movements, audit_logs | — | S-cabang | S-cabang | S (append-only; tanpa U/D siapa pun) |
| users | — | self | self | S (tanpa CRUD sampai #13) |

Larang: ubah `role/branch_id` sendiri (hanya function admin-sistem), direct write
stok/mutasi/saldo, bypass via anon key (RLS tetap menolak), tombol/UI sebagai
pengaman tunggal. Aksi kritis: `record_sale, confirm_receipt, create_allocation,
transition_po` (SECURITY DEFINER + validasi + idempotency + audit).
