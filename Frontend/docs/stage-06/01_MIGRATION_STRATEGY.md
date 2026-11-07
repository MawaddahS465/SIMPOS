# 01 — Strategi Migrasi (STATUS: SUPERSEDED/CANCELLED 12 Okt 2026 — keputusan pengguna:
tetap React+Vite, tanpa CI4/MySQL/Bootstrap. Dokumen ini arsip; JANGAN dieksekusi.)

## Rekomendasi: Strangler + API-first, dua folder berdampingan

```
simpos-optik/      ← prototype React (baseline visual + kontrak, tetap jalan)
simpos-ci4/        ← aplikasi CI4 baru (app/, public/, writable/, .env)
```

1. **Fase A — fondasi**: install CI4 + MySQL (butuh PHP 8.1+/MySQL di mesin — saat ini
   BELUM ADA, pengadaan dulu), skema + seed dari `sharedStore.seed()` (data demo sama,
   tanpa ubah prototype), auth + filter RBAC.
2. **Fase B — API**: endpoint REST mirror kontrak `docs/stage-03/DATA_CONTRACT.md`
   (JSON sama persis dengan bentuk state React) → prototype bisa diuji silang vs API.
3. **Fase C — Views**: CI4 Views + Bootstrap 5 + **CSS existing disalin 1:1**
   (`tokens/layout/login/dashboard/pages/admin/global.css` + Bootstrap utilities untuk
   grid/spacing), komponen React dipetakan ke partials (lihat `02_*`).
4. **Fase D — cutover per batch** (`06_*`): tiap batch diuji Playwright vs baseline
   (screenshot diff + suite lama diadaptasi ke URL CI4). Rollback = kembali ke prototype.

## Yang TIDAK dilakukan

Tanpa hapus/overwrite `simpos-optik/`; tanpa implementasi 14 PENDING (perilaku aman
dipertahankan); tanpa klaim produksi sebelum UAT + hardening; tanpa payment gateway nyata.
