# 04 — Gap Keamanan & Skema (review atas `02_*`, `03_*`, `04_*` stage-08)

## Empat role di matriks RLS

Operasional: kasir/admin/owner sesuai perilaku prototype. Anonymous: default-deny
total (tanpa SELECT publik). Service identity: `service_role` + postgres owner
HANYA di server/function — tidak pernah di klien; audit aksesnya terpisah.

## Isolasi cabang

 Klaim `branch_id` dari JWT (bukan input klien); owner `all`; pusat bukan cabang jual;
 RLS + function ganda untuk tulis stok/uang; negatif test: forged branch/role,
 anon read, direct table write, replay idem-key.

## Empat revisi skema (status)

`users.last_login_at`, `distributions.dispatched_at NULLABLE`, `receipts.reviewed_by`,
`products.price_version` — TETAP USULAN (bergantung #3/#4/#7 PENDING). Tanpa
mengubah ERD final; tanpa kebijakan baru.

## Gap vs 14 PENDING

Setiap field/aturan di atas yang menyentuh item PENDING ditandai `NEEDS_POLICY`;
implementasi menunggu `04_APPROVAL_SHEET`.
