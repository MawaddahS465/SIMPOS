# 06 — Checklist Pengadaan Supabase (JANGAN eksekusi — butuh persetujuan)

- [ ] Project DEV khusus (nama: `simpos-dev`), region terdekat (SG) — JANGAN buat kini.
- [ ] Project PROD terpisah kelak; anon key dev vs prod terpisah; tanpa secret di repo.
- [ ] Supabase CLI + Docker bila perlu migrasi lokal (keduanya belum ada).
- [ ] SDK: `@supabase/supabase-js` (instal saat B0 disetujui).
- [ ] Auth: provider email, password policy, SMTP, redirect URLs.
- [ ] RLS per `03_*` + 4 server function aksi kritis.
- [ ] Backup: jadwal dump (Free) / daily-7d (Pro); uji restore.
- [ ] Monitoring: log retention (Free 1 hari), audit query.
- [ ] Biaya terverifikasi 12 Okt 2026 (sumber: supabase.com/pricing — verifikasi ulang
  saat putuskan): Free $0 (500 MB DB, pause 1 mgg inaktif, maks 2 project, TANPA backup
  otomatis); Pro dari $25/bln + compute (8 GB, backup harian 7 hari). Estimasi SIMPOS:
  Free cukup untuk DEV demo (data <50 MB); produksi butuh Pro.
