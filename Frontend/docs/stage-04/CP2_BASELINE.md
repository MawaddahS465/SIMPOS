# CP2 — Baseline (CP2-A)

Tanggal: 11 Okt 2026. Backup: `backup-src-stage04.zip`→ lanjut `backup-src-cp2.zip` (temp opencode).
Server dev: 200 OK. Tanpa Git (rollback = ekstrak backup ke `src/`).

## Hasil baseline (sebelum perubahan CP2)

- `qa/stage-03/test_cross_role.py`: **33/33 PASS**.
- `qa/stage-04/test_owner_cp1.py`: **9/9 PASS**.
- `npm run typecheck`: bersih.
- Store terverifikasi: `SHARED_STORE_KEY=simpos.shared.v2`, `BRANCH_ID`, `BRANCHES`
  (pusat + cabang-padang), `centralStock` (seed + backfill), `requests`+`notices`,
  `distributions`+`receipts`, `mutations`, `createPO/confirmReceipt/transitionPO/recordSale`.
- Approval berlaku: 4 halaman Owner CP1 + seluruh Kasir/Admin dikunci (tidak disentuh).

## Yang dibangun di CP2 (aditif, key store tetap v2)

Alokasi Owner (`allocations`, reservation outstanding, tanpa debit fisik pusat),
halaman Pengajuan/Alokasi/Mutasi Owner, distribusi Admin membaca alokasi baru,
ledger gabungan. Keputusan terbuka dicatat di `CP2_OPEN_DECISIONS.md`.
