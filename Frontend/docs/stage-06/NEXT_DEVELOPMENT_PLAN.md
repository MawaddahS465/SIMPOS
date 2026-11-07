# NEXT_DEVELOPMENT_PLAN (prioritas, menunggu persetujuan)

1. **Pengesahan 14 item** (`docs/stage-05/04_APPROVAL_SHEET.md`) — gerbang semua batch.
2. **Keputusan backend**: tetap prototype vs bangun backend (ADR). Jika backend:
   skema dari `docs/stage-03/DATA_CONTRACT.md`, auth + RBAC server, migrasi seed,
   lalu hardening + deploy staging.
3. **Perubahan aman tanpa backend** (bila diminta): pengesahan template laporan,
   teks/UX mikro, data demo tambahan — tanpa sentuh logika kunci.
4. **Tidak dilakukan**: migrasi CI4 (SUPERSEDED), Supabase dadakan, gateway nyata,
   implementasi PENDING tanpa tanda tangan.

Urutan: tanda tangan → backend (opsional) → batch A–F `05_*` → UAT klien → hardening.
