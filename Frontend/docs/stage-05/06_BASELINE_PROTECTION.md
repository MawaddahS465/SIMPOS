# 06 — Baseline Protection

## Aset UI terkunci (dilarang ubah tanpa approval baru)

Login ×3, dashboard ×3, monitoring cabang/stok, produk/stok/penerimaan/pengajuan/PO/mutasi
Admin, transaksi/PO/laporan Owner, seluruh halaman Kasir; tokens lavender, sidebar, topbar,
tipografi, spacing, radius, ikon. Baseline visual: `qa/final/screenshots/` (66 file, 0 overflow).

## Baseline fungsional (perintah + status aktual 12 Okt 2026)

- `python qa/stage-03/test_cross_role.py` → 33/33
- `python qa/stage-04/test_owner_cp1.py` → 9/9
- `python qa/stage-04/test_owner_cp2.py` → 29/29
- `python qa/stage-04/test_owner_cp3.py` → 14/14
- `python qa/final/test_uat_final.py` → 14/14
- `npm run typecheck` → bersih
- Dev: `npm run dev` → http://localhost:5173 (tanpa Git di mesin; backup zip per tahap di temp)

## Perlindungan data

Store key `simpos.shared.v2` tidak diubah tahap ini; seed/migrasi/backfill dilarang;
data pengguna tidak disentuh (seluruh uji di profil sekali pakai).
