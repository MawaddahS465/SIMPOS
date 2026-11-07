# REGRESSION_TEST_RESULTS (eksekusi aktual 12 Okt 2026)

| Suite | Hasil |
|---|---|
| stage-03 lintas-role | 33/33 PASS |
| stage-04 CP1 owner | 9/9 PASS |
| stage-04 CP2 alokasi | 29/29 PASS |
| stage-04 CP3 laporan | 14/14 PASS |
| final UAT 16 langkah | 14/14 PASS |
| typecheck | bersih |
| **Total** | **99/99 PASS, 0 pageerror** |

Fokus audit: integritas stok (clamp ≥0, +1/−1 sekali), duplikasi (idempotency),
status PO (state machine + Selesai diblokir), pembayaran (label demo, sukses-only),
relasi antar-role, filter/ekspor (file dibuka + total cocok), responsivitas
(0 overflow, verifikasi sebelumnya), error/empty states (semua halaman punya).
Kegagalan: nihil. Tidak dapat dijalankan: pengujian backend/RBAC-server/gateway
(tidak ada backend) — tercatat BLOCKED di dokumen final.
