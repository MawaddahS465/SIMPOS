# 04 — Desain Auth & RBAC (PROPOSED)

## Autentikasi

Supabase Auth (email/password, hash server, JWT, refresh rotation, idle timeout) atau
setara opsi B/C. Akun demo ≠ produksi: seed demo terpisah + flag; password demo
dipublikasikan di UI HANYA untuk demo; produksi = provisioning oleh petugas berwenang
(item #13) + reset via email. Session expiry + logout invalidate.

## Otorisasi: peran × cabang (ikut PRD + perilaku prototype)

Kasir: transaksi/PO/pelanggan/resep di cabangnya; tanpa alokasi/penerimaan/edit master.
Admin: katalog/minimum/penerimaan/pengajuan/PO cabangnya; tanpa alokasi/pusat/cabang lain.
Owner: baca semua lokasi + alokasi + laporan; tanpa checkout/penerima-fisik/ubah PO/transaksi.

## Penegakan (bila Supabase)

RLS: `SELECT` scoped `branch_id = auth.branch_id()` (owner bypass); `INSERT` receipts/
requests/pos hanya role+branch cocok; `UPDATE` stok HANYA via server function
(`record_receipt`, `record_sale`, `transition_po`, `create_allocation`) dengan
`SECURITY DEFINER` + validasi + idempotency + audit. Tanpa direct write
`branch_stocks/movements` dari klien. Owner tanpa fungsi tulis operasional.

## Negatif testing (saat implementasi)

Sesi basi, forged branch_id/role, direct URL/API, double-submit, replay idem key,
akses PII lintas modul, ekspor melebihi scope. Secret (service-role/DB) DILARANG di Vite.
