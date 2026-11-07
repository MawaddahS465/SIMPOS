# 03 — Kebutuhan Tooling (wajib vs opsional)

## Wajib sebelum B0

- Git for Windows (versioning; status kini NOT READY).
- Persetujuan + project Supabase DEV (oleh yang berwenang).
- `@supabase/supabase-js` (instal SAAT B0 disetujui, bukan kini).

## Opsional / bersyarat

- Supabase CLI: hanya bila migrasi file-based/CI (workflow awal via dashboard cukup).
- Docker: hanya untuk local stack (tidak perlu bila hosted DEV).
- psql: hanya bila dump/restore CLI diinginkan (alternatif: dashboard).
- Node/npm: SUDAH ADA (v24/npm 11) — tanpa update.

## Verifikasi tiap tool (saat diizinkan)

`git --version`, `supabase --version`, `docker --version`, koneksi project
(select 1), anon key terbaca dari vault (bukan repo). Tanpa instalasi tahap ini.
