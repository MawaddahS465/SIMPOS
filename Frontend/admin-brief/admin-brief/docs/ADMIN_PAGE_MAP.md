# ADMIN CABANG — page map & ownership

Source: `PRD_SIMPOS_Optik_Mekar_Jaya_Admin_Cabang.pdf` (draft 10 Okt 2026).

| PRD | Route suggested | Main action | Owner |
|---|---|---|---|
| A01 | shared `/login` -> `/admin/dashboard` | Authenticate, resolve branch and role | Login shared |
| A02 | `/admin/dashboard` | See branch alerts & workload, open relevant task | Admin |
| A03 | `/admin/produk/frame` | Frame CRUD/category/price | Admin |
| A04 | `/admin/produk/lensa` | Lens CRUD/category/price | Admin |
| A05 | `/admin/stok` | View stock/minimum/mutations, set min | Admin |
| A06 | `/admin/penerimaan` | Confirm received physical stock | Admin |
| A07 | `/admin/pengajuan` | Submit request to owner | Admin |
| A08 | `/admin/pemesanan` and `/:id` | Process and inspect PO | Admin |
| A09 | `/admin/mutasi` | Read stock event ledger | Admin |

`/admin/distribusi` is a read-only view of owner-issued allocation and may be combined with Penerimaan on one screen if approved.

**Not in Admin:** cashier sales, checkout, payment processing, customer and prescription master editing, owner consolidated dashboard, owner allocation approval, supplier purchasing.

**Known unresolved**: master data shared vs per branch; the user/role responsible for recording receipt at head office; transfer in-transit semantics; stock damaged/lost/return adjustments; receiving discrepancies; request workflow; who marks PO Selesai; final backend stack.
