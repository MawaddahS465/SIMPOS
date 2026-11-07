# CP2 — QA Report (hasil aktual)

Perintah: `python qa/stage-04/test_owner_cp2.py` (profil bersih) → **29/29 PASS**, 0 pageerror.
Baseline ulang pasca-CP2: `test_cross_role.py` **33/33**, `test_owner_cp1.py` **9/9**,
`npm run typecheck` bersih. Screenshot: `qa/stage-04/cp2/{desktop,mobile,tablet}/`.

| ID | Status | Bukti |
|---|---|---|
| CP2-01, 01b | PASS | REQ-2026-001; terlihat di tabel Owner |
| CP2-02 | PASS | requests tetap 1 setelah 0/-2/1.5 |
| CP2-03 | PASS | stok cabang+pusat identik |
| CP2-04 | PASS | filter cabang tampilkan REQ |
| CP2-05/20 | PASS | `cabang-bogor`/`cabang-lain` ditolak (satu cabang demo; server BLOCKED) |
| CP2-06 | PASS | DIST-2026-024 parsial 2/4, sisa 2 |
| CP2-07 | PASS | over-available ditolak + pesan; tanpa tulis |
| CP2-08 | PASS* | sekuensial kedua ditolak; *konkurensi paralel = DEMO_ONLY |
| CP2-09 | PASS | 1 alokasi (DIST-2026-025) + pesan duplikat |
| CP2-10 | PASS | AID tampil di Penerimaan Admin |
| CP2-11/12 | PASS | kasir+admin → `/owner/login` |
| CP2-13 | PASS | stok cabang 9 tetap pasca-alokasi |
| CP2-14 | PASS | onHand 20, reserved 2, available 18 |
| CP2-15 | BLOCKED | tanpa tahap dispatch (keputusan terbuka) |
| CP2-16 | PASS | 9→11 + 1 mutasi IN |
| CP2-17 | PASS | input hilang + hook tolak, 11→11 |
| CP2-18 | PASS | tercakup CP2-07/CP2-26 + INT-21 |
| CP2-19 | PASS | Diterima Sebagian, selisih −2 terekam |
| CP2-21 | PASS | RC + reservasi tampil di ledger |
| CP2-22 | PASS | hanya sumber fisik di mutations |
| CP2-23/24 | PASS | jual −1 sekali; retry ref idempoten |
| CP2-25 | PASS | mu=12, d=5 tetap pasca-reload |
| CP2-26 | PASS | cabang-tujuan Pusat ditolak atomik |
| CP2-27 | PASS | filter Fisik + reset benar |
| CP2-28 | PASS | 4 layar CP1 mean-diff **0.00** (identik piksel) |
| CP2-29 | PASS | 4 mobile + 4 tablet, 0 overflow |
| CP2-30 | PASS | guard + logout konsisten |
| CP2-31 | PASS | dashboard hitung request nyata |
| CP2-32 | PASS | Pusat ≠ Padang, benar terpisah |
| CP2-33 | PASS | tanpa nama/HP/SPH di 3 modul logistik |
| CP2-34 | PASS | 33/33 + 9/9 + typecheck pasca-CP2 |

Bug ditemukan & diperbaiki: (1) validasi longgar `replace(/[^0-9]/g)` ("1.5"→15) di 3 form —
sekarang regex ketat + pesan jelas; (2) tidak ada yang lain (UI anti-ganda bekerja).
