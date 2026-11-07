# STAGE 03 — Data Contract (implementasi: `src/store/sharedStore.tsx`)

Satu `SharedProvider` di root; persistensi `localStorage simpos.shared.v2` (demo).
Uang = integer rupiah (`Math.round` untuk PPN); tanpa float. Waktu = string zona WIB.

| Kontrak prompt | Implementasi | Kunci/aturan |
|---|---|---|
| `branches` | `BRANCH_ID = "cabang-padang"` + `branchId` di tiap entitas | single-branch demo; guard menolak `branchId` lain |
| `users` | `store/session.ts` `Session{role,name,initials,branch,branchId,email}` | role `kasir`/`admin`; akun demo jelas |
| `products` | `AdminProduct{id,code,name,brand,type,category,price,tag?,status,branchId,updatedAt}` | `type`: Frame/Lensa/Aksesoris |
| `branch_stocks` | `StockRow{productId,branchId,saldo,minimum}` | unik per product+branch; non-negatif (clamp) |
| `customers` / `prescriptions` | `data/customers.ts` (statis, read-only) | resep PO disalin, bukan direferensikan |
| `purchase_orders` + items + snapshot | `SharedPO{...PoOrder,branchId,timeline[],resepSnapshot{od,os,pd,add,at}\|null}` | snapshot terkunci per-PO |
| `sales` + `payments` | `Receipt` (CartContext, in-memory) + `Transaction` di store | `saleRefs[]` = idempotency key (no. struk) |
| `stock_movements` | `Mutation{id,at,productId,branchId,arah,sumber,qty±,sebelum,sesudah,ref,actor}` | ref unik per event; tanpa hapus/ubah |
| `stock_requests` | `StockRequest{id,at,actor,branchId,productId,qty,note,status:"Diajukan"}` + `OwnerNotice[]` mock | tidak menyentuh stok |
| `goods_receipts` | `ReceiptRecord{id,distributionId,productId,qty,at,actor,branchId,idempotencyKey,s note,selisih}` + `Distribution{id,date,from,branchId,status,lines[]{qtyAlokasi,qtyDiterima}}` | kunci `distribution::product`; 1 baris = 1 bukti |
| `audit_logs` | `AuditEntry{id,at,actor,branch,action,ref}` | tanpa password/token |

Migrasi: `migrateOld()` sekali dari `simpos.admin.store.v2` (produk/minimum/draf Tahap 01).
Jalur migrasi backend: ganti isi `SharedProvider` dengan API calls + validasi server,
kontrak field tidak berubah; tulis `BLOCKED` untuk otorisasi server sampai backend ada.
