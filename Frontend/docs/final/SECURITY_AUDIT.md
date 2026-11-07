# SECURITY AUDIT — Checkpoint 4 (jujur: frontend-only)

## PASS (teruji)

- Guard rute 3 role + cabang: direct URL, forged `branchId`, logout → redirect benar
  (INT-02/03/04/19, T04-02/05, NEG-3, CP2-11/12/30).
- Poisoned write ditolak di store: alokasi cabang asing, over-available, over-alokasi,
  transisi ilegal, qty invalid (CP2-05/07/18/20/26, NEG-2).
- Idempotency: alokasi, receipt, sale (CP2-09/17, INT-11/13, CP2-24).
- Validasi input integer ketat di 4 form + pesan jelas (CP2-02).
- PII: tanpa nama/HP/resep di modul logistik Owner (CP2-33); PO Owner sembunyikan nilai resep.
- Tanpa password/token di audit log; kredensial hanya label demo di UI.

## DEMO_ONLY (bukan keamanan produksi)

- Sesi = localStorage, tanpa hash/ekspirasi server; role dapat ditulis manual di devtools.
- "Otorisasi" = guard klien + validasi store; tanpa middleware server.
- Satu browser = satu sumber data; tanpa isolasi multi-perangkat.
- Hook `window.__simpos` aktif hanya di build DEV.

## BLOCKED (butuh backend)

RBAC server, rate-limit, audit sisi server, enkripsi, HTTPS/HSTS, payment callback
terverifikasi, konkurensi paralel, backup/restore, monitoring error.

## FAIL: tidak ada pada cakupan prototype.
