# STAGE 04 — Baseline Audit (Checkpoint 0)

Tanggal: 11 Okt 2026. Tanpa Git (backup: `backup-src-stage04.zip` di temp opencode).
Stack: React 18 + TS + Vite 5, react-router 6, Lucide, CSS tokens; **frontend-only,
localStorage demo** — tanpa backend. Tidak ada migrasi stack.

## Bukti Tahap 03 (bukan asumsi)

- `qa/stage-03/test_cross_role.py` dijalankan ulang hari ini: **33/33 PASS**, 0 pageerror.
- `npm run typecheck`: bersih.
- Sumber data tunggal: `src/store/sharedStore.tsx` (`simpos.shared.v2`) dipakai Kasir
  (katalog, checkout→stok, PO, riwayat) dan Admin (produk, stok, penerimaan, PO, mutasi).
- Sesi bersama `src/store/session.ts` + `KasirGuard`/`AdminGuard`; penolakan lintas-role
  dan lintas-cabang (level klien) teruji INT-02/03/04/19.
- Blocker riil untuk Owner: belum ada lokasi Pusat/stok pusat, belum ada role `pemilik`,
  belum ada rute `/owner/*`. Ditutup di Checkpoint 1 secara aditif (tanpa ubah format store —
  backfill, bukan bump key).

## Keputusan terbuka yang diwarisi (tetap berlaku)

PO Selesai (NEEDS_CLIENT_APPROVAL), waktu kurangi stok pusat/in-transit, approval pengajuan,
master global vs per-cabang, RBAC server, gateway. Ditambah: cabang kedua (Bukittinggi hanya
muncul sebagai opsi teks di login Kasir — belum ada data; Owner memantau Pusat + Padang).
