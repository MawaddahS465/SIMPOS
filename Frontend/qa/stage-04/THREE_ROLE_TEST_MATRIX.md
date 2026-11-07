# STAGE 04 — Three-Role Test Matrix (Checkpoint 1)

Runner: `qa/stage-04/test_owner_cp1.py` (Playwright). **9/9 PASS.**

| ID | Skenario | Status | Bukti |
|---|---|---|---|
| T04-01 | Owner login → dashboard Owner | PASS | URL `/owner/dashboard` |
| T04-02 | Kasir/Admin akses route Owner | PASS | redirect `/owner/login` |
| T04-03 | Filter Padang / Pusat / Semua | PASS | isi berbeda konsisten |
| T04-05 | Logout → akses ditolak | PASS | redirect login |
| T04-06 | Pengajuan terlihat Owner, stok utuh | PASS | read-only |
| T04-25/26 | Regresi Kasir/Admin | PASS | hero + stok render, 0 error |
| T04-27 | 4 layar mobile 390×844 | PASS | 0 overflow |

Belum dijalankan (CP2–4): T04-04 lintas-cabang server, T04-07…T04-24 alokasi/laporan/ekspor.
Status visual Owner: konsistensi design-system, bukan pixel-perfect (tanpa approved-ref).
