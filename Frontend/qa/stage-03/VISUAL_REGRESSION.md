# STAGE 03 — Visual Regression (hasil aktual)

Aset: `qa/stage-03/screenshots/{desktop (13), mobile (13), tablet (4)}`.
File Kasir yang diubah Tahap 03: logika sumber-data + 1 drawer + 1 tombol disabled + 1 notice
stok — **nol perubahan CSS Kasir** (`git` tak tersedia; diff diverifikasi via daftar edit + OCR).

- Login Kasir/Admin: geometri kartu identik sesi lalu (kolom visual x≈45, form x≈1025).
- Shell 12 layar: sidebar `#f7f8fe`, pill aktif lavender, topbar search+bell+avatar — konsisten.
- Header halaman (overline y≈160, H1 y≈186) & header tabel (y≈362) selaras lintas role.
- Elemen baru (drawer Buat PO, tombol disabled + tag, error dalam modal penerimaan)
  memakai token existing (`.drawer`, `.btn-disabled`, `.nav-soon`, `.form-error`).
- Mobile 390×844 (13/13) & tablet 768×1024 (4/4): **tidak ada page-wide horizontal overflow**;
  tabel scroll lokal, drawer full-width.
- Perbaikan visual selama QA: pesan error penerimaan kini tampil di dalam modal
  (sebelumnya tertutup overlay).

Status Admin = konsistensi design-system (bukan klaim pixel-perfect; tanpa approved-ref Admin).
