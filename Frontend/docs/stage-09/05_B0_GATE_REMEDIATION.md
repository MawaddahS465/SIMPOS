# 05 — Remediasi 7 Gate B0 (nama, status, bukti, tindakan, risiko, lulus, izin)

1. **Persetujuan tertulis** — OPEN. Bukti: `04_APPROVAL_SHEET` kosong. Tindakan: pengguna
   tandatangani (opsi Supabase + 14 PENDING). Risiko: scope-creep. Lulus: sheet terisi.
   Izin: PENGGUNA. (Syarat B0; bukan B1/produksi.)
2. **Git + repo + backup** — OPEN. Bukti: git tidak ada; backup zip ada. Tindakan: instal
   Git → repo privat → restore-terbukti → commit awal (`01_*`). Risiko: history hilang.
   Lulus: `git log` + restore OK. Izin: instal + repo.
3. **Project DEV + region** — OPEN. Tindakan: buat `simpos-dev` SG oleh yang berwenang
   (`02_*`). Risiko: biaya/PII. Lulus: URL tercatat di vault. Izin: PENGGUNA.
4. **RLS review + negatif test** — PARTIAL (rancangan lengkap, belum review formal).
   Tindakan: walkthrough `03_*` + siapkan skrip negatif. Lulus: checklist ditandatangani.
5. **17 tabel + 4 function** — PARTIAL (desain siap + 4 revisi usulan). Tindakan: sahkan
   skema. Lulus: ADR ditandatangani.
6. **Backup/restore + jadwal** — OPEN. Tindakan: tetapkan jadwal dump + uji restore.
   Lulus: 1 restore terbukti.
7. **Baseline hijau** — PASS. Bukti: 99/99 + typecheck 12 Okt 2026 (diulang tahap ini).

Tanpa satu gate diklaim PASS tanpa bukti di atas.
