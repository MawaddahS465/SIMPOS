# 01 — Audit Model Data Aktual (read-only, 12 Okt 2026)

Sumber: `src/store/sharedStore.tsx`, `data/*.ts`, `CartContext`, `session.ts`, `reports.ts`.

## Entitas di store (key `simpos.shared.v2`)

| Entitas | Field kunci | Ditulis oleh |
|---|---|---|
| Branch | id, name, type Pusat/Cabang | seed (2 lokasi) |
| AdminProduct | id, code, name, brand, type, category, price INT, tag?, status, branchId | upsert/deactivate (Admin) |
| StockRow / centralStock | productId, branchId, saldo, minimum | seed; berubah hanya via event |
| StockRequest | id, actor, branchId, productId, qty, note, status=Diajukan | createRequest (Admin) |
| Distribution + DistLine | id, from, branchId, status, lines{qtyAlokasi, qtyDiterima}, requestId?, actor?, note?, idemKey? | createAllocation (Owner) |
| ReceiptRecord | id, distributionId, productId, qty, idemKey `distribution::product`, selisih | confirmReceipt (Admin) |
| SharedPO | PoOrder + branchId, timeline[], resepSnapshot{od,os,pd,add,at}\|null | createPO (Kasir), transitionPO (Admin) |
| Transaction | mock + branchId?, method?, products[] snapshot | recordSale (Kasir, idem `saleRefs`) |
| Mutation | arah IN/OUT, sumber, qty±, sebelum→sesudah, ref, actor | event receipt/sale |
| OwnerNotice, AuditEntry | antrean mock; {waktu, aktor, cabang, aksi, ref} | baca/tulis sistem |

Statis (tidak di store): `customers.ts`, `RESEP_MAP`, `RESEP_RECORDS`, `PAYMENTS`,
katalog seed `catalog.ts`. Sesi: `simpos.session` {role, branchId} (kasir/admin=cabang,
pemilik=all). Uang integer IDR; tanggal string ID ("12 Agu 2026", `parseIdDate`).

## Operasi CRUD nyata

Create: product, request, allocation, receipt, PO, sale, audit. Read: semua halaman.
Update: product, minimum, status PO (state machine), status distribusi (derivasi terima).
Delete: TIDAK ADA (soft-delete produk; mutasi/ledger abadi). Simulasi: sesi, notifikasi
mock, angka dashboard (derivasi real), checkout selalu-sukses. Belum ada: dispatch,
pembatalan, approval/reject, refund/DP, akun/CRUD cabang.
Aturan PENDING (14 item) tidak diimplementasikan — perilaku aman dikunci.
