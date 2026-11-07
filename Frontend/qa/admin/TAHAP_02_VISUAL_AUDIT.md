# ADMIN TAHAP 02 — Visual Audit (provisional, belum disetujui)

Tanggal: 11 Okt 2026. Screenshot: `qa/admin/desktop/*.png` (1536×1024), `qa/admin/mobile/*.png` (390×844).
Metode: Playwright Chromium DPR 1 (desktop) / DPR 2 (mobile); verifikasi via OCR + sampling warna + ukur DOM.
Baseline gaya: Tahap 01 Admin + `admin-brief/references/shared-design/` (Kasir). Tahap 01 sendiri belum
dikonfirmasi user → seluruh visual Tahap 02 berstatus **provisional**, bukan pixel-perfect.

## 1. Cakupan screenshot

| Layar | Desktop | Mobile |
|---|---|---|
| Penerimaan Barang | ✅ `desktop/penerimaan.png` | ✅ `mobile/penerimaan.png` |
| Distribusi Masuk | ✅ `desktop/distribusi.png` | — (pola tabel sama) |
| Pengajuan Stok | ✅ `desktop/pengajuan.png` | ✅ `mobile/pengajuan.png` |
| Pemesanan (PO) | ✅ `desktop/pemesanan.png` | — |
| Detail PO | ✅ `desktop/pemesanan-detail.png` | — |
| Riwayat Mutasi | ✅ `desktop/mutasi.png` | — |
| Regresi dashboard/stok | ✅ `desktop/dashboard.png`, `desktop/stok.png` | — |

## 2. Hasil perbandingan vs design system

- Shell identik di 6 layar baru: sidebar `#f7f8fe` x≈61–95, edge lavender `#e8eafb`, topbar
  (brand x≈115, search x≈411, `Ctrl+K` x≈921, avatar RA x≈1298, nama + "Admin Cabang").
- Header halaman: overline y≈160 (x333), H1 y≈186–189, deskripsi y≈227–257 — sama dengan Tahap 01.
- Header tabel y≈362–383 (pemesanan/pengajuan/stok/mutasi), pola `table.tt` + `StatusPill` sama.
- Komponen baru (`recv-line`, drawer pengajuan, dialog konfirmasi sebelum/sesudah) memakai token
  (`--r-md`, `--shadow-sm`, `--accent`, `--ok-bg`) — tidak ada warna/tema baru.
- Perbaikan selama QA: entri timeline seed "Dipesan→Dipesan" → riwayat wajar ("Baru→Dipesan" + transisi).
- Mobile 390×844: tidak ada page-wide horizontal overflow (cek `scrollWidth`) di penerimaan & pengajuan;
  tabel scroll lokal, drawer full-width.

## 3. Gap / bukan klaim

- Tidak ada `references/admin-approved/` untuk 6 layar ini → tidak diklaim pixel-perfect.
- Foto produk tidak dipakai di tabel operasional (sesuai larangan hero e-commerce di layar operasional).
