# 10 — Architecture Decision Record (PROPOSED, bukan APPROVED)

- ADR-07-01: Backend = **Opsi A (Supabase + PG + Auth + RLS)** — PROPOSED.
  Konteks/bobot/alternatif B/C: `02_*`. Syarat: verifikasi pricing + persetujuan
  residensi PII + 14 item kritis (#1–#6) minimal terarah.
- ADR-07-02: Skema = `03_*` (relasional, integer IDR, idempotency UNIQUE) — PROPOSED.
- ADR-07-03: Integrasi React via lapisan repo ganda + flag — PROPOSED.
- ADR-07-04: Migrasi localStorage hanya seed eksplisit, tanpa baca data pengguna — PROPOSED.

Ketiganya menunggu: pilihan opsi stakeholder + approval sheet 14 item + lingkungan.
Tanpa tanda tangan = tanpa implementasi.
