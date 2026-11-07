# 02 — Pilihan Environment Supabase (rekomendasi: hosted DEV dulu)

**Hosted project DEV** untuk awal (tanpa Docker/CLI/psql lokal): dashboard SQL editor +
Table editor + Auth + backup manual via dump. Alasan: tim tanpa Docker/psql; B0 hanya
fondasi+auth; biaya $0; risiko terkendali (data seed demo).

**Local development** (CLI + Docker) diperlukan bila: migrasi file-basedatic, CI,
atau kebijakan data-tidak-boleh-keluar. Saat ini TIDAK wajib — tandai OPSIONAL sampai
B1. Bila kelak perlu: instal Docker Desktop + `supabase` CLI + `psql`, `supabase init`
di folder terpisah (bukan di repo prototype tanpa persetujuan struktur).

## Risiko Free (dari `06_*` stage-08, terverifikasi resmi)

Tanpa backup otomatis; pause 1 minggu inaktif (demo mati); 500 MB; 2 project.
Mitigasi: dump SQL manual terjadwal + seed ulang dari `sharedStore.seed()`; pisahkan
project DEMO (boleh pause) dari DEV (jaga aktif); naik Pro bila masuk data nyata/UAT.

## Pemisahan environment

`simpos-dev` (eksperimen, boleh reset) ≠ demo lokal :5173 (tetap jalan) ≠ prod (belum ada).
Satu project = satu env; kunci dev/prod terpisah; tanpa sinkronisasi otomatis antar-env.
Checklist pembuatan project DEV (08-B0): persetujuan → buat project + region SG →
catat URL/anon (vault, bukan repo) → aktifkan RLS default-deny → milestone B0.
