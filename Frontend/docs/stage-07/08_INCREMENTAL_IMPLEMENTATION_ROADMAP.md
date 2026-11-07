# 08 — Roadmap Bertahap (setelah arsitektur disetujui; JANGAN mulai kini)

B0 fondasi+env (dep: pilihan opsi) — gate: koneksi+auth tes hijau.
B1 auth/akun/role/branch (dep B0) — gate: guard 3 role + forged ditolak.
B2 master pelanggan/produk/resep/stok read (dep B1) — gate: katalog = seed.
B3 checkout+sale atomik (dep B2) — gate: −1 sekali, retry idempoten, clamp.
B4 PO (dep B2) — gate: snapshot abadi, state machine, Selesai terkunci.
B5 request→alokasi→receipt (dep B2) — gate: outstanding/available benar, sekali catat.
B6 dashboard/laporan/ekspor (dep B3–B5) — gate: file terbuka + total cocok.
B7 QA integrasi + security + UAT + demo (dep semua) — gate: 99/99 + baru hijau.

Tiap batch: scope, file terdampak (`repo.ts`, fungsi server, Views/tanpa ubah React),
acceptance, test case, risiko, rollback (flag off / restore dump), approval gate.
Estimasi diisi setelah opsi dipilih (acuan kasar: 6–11 mgg untuk backend penuh, warisan
stage-05 — bukan komitmen).
