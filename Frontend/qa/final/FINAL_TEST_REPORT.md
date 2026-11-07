# FINAL TEST REPORT — Checkpoint 4

| Suite | Hasil | Perintah |
|---|---|---|
| stage-03 lintas-role | 33/33 PASS | `python qa/stage-03/test_cross_role.py` |
| stage-04 CP1 owner | 9/9 PASS | `python qa/stage-04/test_owner_cp1.py` |
| stage-04 CP2 alokasi | 29/29 PASS | `python qa/stage-04/test_owner_cp2.py` |
| stage-04 CP3 laporan | 14/14 PASS | `python qa/stage-04/test_owner_cp3.py` |
| final UAT 16 langkah | 14/14 PASS | `python qa/final/test_uat_final.py` |
| typecheck | bersih | `npm run typecheck` |
| **Total** | **99/99 PASS, 0 pageerror** | |

UAT mencakup: beli→bayar→stok, PO→proses→pantau, ajukan→alokasi→terima→mutasi→laporan→
ekspor, multi-cabang terisolasi (injeksi `cabang-uji` sekali pakai; data pengguna tak tersentuh),
negatif (over-stock, lompat-Selesai, guard peran, forged cabang), reload, idempotency.
Satu bug riil ditemukan CP4 (ID mutasi tak tampil di ledger Owner) → diperbaiki + teruji (U14b).
FAIL lain: nihil. BLOCKED: backend/RBAC-server/gateway/konkurensi paralel (terdokumentasi).
