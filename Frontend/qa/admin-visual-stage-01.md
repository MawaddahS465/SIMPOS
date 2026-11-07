# Admin Cabang — Visual QA Tahap 01 (BELUM FINAL, menunggu persetujuan)

Tanggal: 11 Okt 2026. Screenshot: `qa/admin/desktop/*.png` (1536×1024) + `qa/admin/mobile/*.png` (390×844).
Metode: Playwright Chromium, DPR 1. Struktur halaman diverifikasi via OCR + sampling warna + ukur DOM.
Pembanding: `admin-brief/references/shared-design/*.png` (sistem Kasir).

## 1. Hasil per layar

| # | Layar | Rute | Status |
|---|-------|------|--------|
| A | Login Admin | `/admin/login` | ✅ Siap review |
| B | Dashboard Admin | `/admin/dashboard` | ✅ Siap review |
| C | Produk Frame / Lensa | `/admin/produk/frame`, `/admin/produk/lensa` | ✅ Siap review |
| D | Stok Cabang | `/admin/stok` | ✅ Siap review |

## 2. Yang MATCH dengan sistem Kasir (reuse, bukan tiruan)

- Shell: sidebar 255 px `#f7f8fe`, mainpanel lavender, topbar (search pill + `Ctrl+K` + bell + avatar), breakpoint drawer <900 px — kelas `layout.css` yang sama persis.
- Login: `login.css` sama; geometri kartu identik (kolom visual x≈45–971, form x≈1025+, headline y≈257–268, tombol Masuk, demo-foot). Hanya teks + chip cabang yang beda.
- Komponen: `PageHeader` (overline 11.5 px / H1 30 px), `StatCard`, `Chip`, `table.tt` (header 10.5 px ls 1.4), `StatusPill`, `.btn-primary` violet, radius 30/22/15/11, font Plus Jakarta Sans.
- Geometri terukur (desktop, CSS px): sidebar x35 w255; H1 y≈183–189; header tabel y≈361–384; search y≈285–308 — selaras pola Kasir (header tabel PO Kasir y≈564 pada增多 kolom; pola sama).
- Mobile 390×844: **tidak ada page-wide horizontal overflow** di dashboard/produk/stok (cek `scrollWidth`), tabel scroll TERLOKALISIR, drawer full-width.

## 3. Keputusan BARU khusus Admin (bukan dari Kasir)

1. Sidebar dikelompokkan (UTAMA / MASTER PRODUK / PERSEDIAAN / OPERASIONAL); item Tahap 02 nonaktif + tag "Segera" (bukan dead link).
2. Login Admin: cabang TERKUNCI `Cabang Padang` (chip, bukan dropdown) — Admin tidak memilih cabang.
3. Dashboard minimalis: 3 indikator (Stok Menipis / PO Baru / Menunggu Penerimaan), panel "Perlu Ditindaklanjuti" maks 5 baris, tanpa revenue/chart.
4. Produk: tabel + drawer tambah/ubah + nonaktifkan (soft delete, bukan hapus fisik); validasi harga > 0.
5. Stok: kolom Stok / Minimum / Status; label "Stok Menipis" saat saldo ≤ minimum (teruji: FR-003 2/3, FR-005 4/4, LS-008 3/3); aksi "Atur Minimum" + "Ajukan Stok" (draf demo lokal).
6. Data demo persisten `localStorage` (`simpos.admin.store.v2`); akun `admin@mekarjaya.demo / demo123`, terpisah dari Kasir.

## 4. Regresi Kasir

- `/login` → "Selamat Datang", `/dashboard` → hero "Korena Saif", nol `pageerror`.
- File Kasir yang disentuh: TIDAK ADA, kecuali `ui.tsx` (+2 entri warna status "Stok Menipis"/"Aman" — tidak dipakai layar Kasir) dan `App.tsx` (+rute `/admin/*` saja).

## 5. Yang BELUM / terbuka (jujur)

- Visual Admin **bukan pixel-perfect** — belum ada `references/admin-approved/`; label ini menunggu persetujuan Anda.
- Sinkronisasi Kasir↔Admin (produk baru tampil di Kasir, penjualan mengurangi stok Admin, PO lintas role) masuk Tahap 02 via shared store — saat ini Kasir membaca katalog statisnya sendiri.
- Keputusan PRD terbuka tetap berlaku: master global vs per-cabang, siapa menandai PO Selesai, alur approval pengajuan, stack backend.
- UAT A-U01…A-U12 dan RBAC server belum dijalankan (prototype frontend; penegakan cabang saat ini di sisi klien + label demo).
