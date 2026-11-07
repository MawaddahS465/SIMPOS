# 07 — Baseline QA + Review Flake CP2-19

Hasil aktual (profil sekali pakai, tanpa sentuh data pengguna):
33/33 + 9/9 + 29/29 + 14/14 + 14/14 = **99/99 PASS**, typecheck bersih.

## Flake CP2-19 (StopIteration `d6`)

Penyebab: `createAllocation` via hook `window.__simpos` terpanggil tepat setelah
navigasi, sebelum `useEffect` provider me-mount ulang hook — `evaluate` mengembalikan
`undefined`, `["id"]` gagal diam-diam dalam konteks, `d6` kosong → `next()` StopIteration.
Bukan bug aplikasi (UI + store benar; rerun 29/29). Rerun tahap ini: CP2 29/29 langsung
lulus tanpa retry. Mitigasi bila suite dipakai lagi: tunggu `window.__simpos` ada
(`wait_for_function`) sebelum panggil hook; JANGAN ubah test agar lulus (dilarang) —
tambahkan penantian eksplisit saja. Status: MITIGATED-BY-DOCUMENTATION, bukan code fix
(freeze tahap ini).
