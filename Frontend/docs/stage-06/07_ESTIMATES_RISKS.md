# 07 — Estimasi, Risiko, Urutan (asumsi: 1–2 dev, kontrak data dipakai ulang)

Estimasi indikatif (bukan komitmen): B0 3–5 hari (termasuk pengadaan PHP/MySQL) ·
B1 3–4 · B2 3–4 · B3 4–6 · B4 3–5 · B5 5–7 · B6 4–6 · B7 5–8 → **total 30–45 hari kerja**.
Sulit→mudah: B7 > B5 ≈ B3 > B6 > B4 > B1 ≈ B2 > B0 (non-lingkungan).

Risiko: (1) lingkungan backend belum ada — mitigasi: XAMPP/Laragon atau VPS staging
dulu; (2) drift visual — mitigasi: CSS 1:1 + diff gate; (3) 14 PENDING merembes ke
implementasi — mitigasi: perilaku aman dikunci, flag per batch; (4) data demo vs nyata
tercampur — mitigasi: seeder terpisah + `is_demo`; (5) ekspor berbeda format —
mitigasi: samakan kolom + uji buka file.

File terdampak (saat coding dimulai): baru `simpos-ci4/` (app, public, writable, .env);
prototype dan `docs/stage-05` tidak disentuh; suite QA disalin-adaptasi per batch.
