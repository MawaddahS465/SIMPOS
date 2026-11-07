# OpenCode Admin Cabang — Cara mulai

Kit ini khusus desain dan implementasi Admin Cabang, bukan pengganti Kasir.

1. Ekstrak folder `admin-brief` dari ZIP ke **root repository yang sudah digunakan untuk role Kasir**.
2. Jangan hapus/mengganti `src`, `references`, atau `assets` Kasir yang sudah ada.
3. Jalankan OpenCode dari root repo, bukan dari dalam folder kit.
4. Kirim instruksi:
   `Baca admin-brief/MASTER_PROMPT_ADMIN_OPENCODE.md dan seluruh sumber yang dirujuk. Audit repository dan kerjakan TAHAP 01 (Login/shared role redirect, Dashboard Admin, Produk Frame/Lensa, Stok Cabang). Jangan ubah halaman Kasir. Capture screenshot 1536x1024 dan 390x844, lakukan visual QA, laporkan hasil dan tunggu approval saya sebelum tahap 02.`
5. Review 4 anchor screens dahulu. Jika tidak sesuai styling Kasir, minta CSS/layout changes + screenshot re-test sebelum lanjut.
6. Setelah oke, minta `Lanjut TAHAP 02 sesuai master prompt Admin, termasuk penerimaan, distribusi masuk, pengajuan stok, pemrosesan PO dan mutasi. Jalankan UAT dan visual QA.`

PENTING: Materi visual Admin final belum tersedia; folder `references/admin-approved/` sengaja kosong. Screenshot Kasir adalah SHARED DESIGN SYSTEM, bukan halaman Admin untuk disalin mentah.

PRD sumber masih mempunyai keputusan terbuka termasuk stack CodeIgniter 4/MySQL versus React/Supabase, dan hak yang menutup status PO. AI tidak boleh memutuskannya diam-diam.
