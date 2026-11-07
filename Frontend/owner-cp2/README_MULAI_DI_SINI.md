# LANJUTKAN OWNER CP2 — CARA PAKAI

Paket ini **bukan aplikasi baru** dan tidak berisi source code SIMPOS milik pengguna. Ini adalah instruksi terperinci untuk OpenCode yang dijalankan pada repo SIMPOS yang sudah dipakai Kasir, Admin dan Owner CP1.

## Langkah ringkas

1. **Backup/commit pekerjaan terakhir** di project utama; jangan overwrite file lama.
2. Ekstrak ZIP di root repository SIMPOS. Pastikan ada folder `owner-cp2` berisi master prompt dan QA matrix.
3. Jalankan OpenCode di **root repo SIMPOS yang sama**.
4. Kirim prompt mulai berikut:

   > Lanjutkan SIMPOS Optik Mekar Jaya Tahap 04 Checkpoint 2. Baca tuntas `owner-cp2/MASTER_PROMPT_OPENCODE_OWNER_CP2.md` dan `owner-cp2/qa/CP2_TEST_MATRIX.md`. Desain Login/Dashboard/Monitoring Cabang/Monitoring Stok Owner Checkpoint 1 sudah saya SETUJUI: jangan diubah. Audit repo, jalankan baseline, lalu implementasi Pengajuan Barang → Alokasi Owner → Distribusi/Penerimaan Admin → Riwayat Mutasi secara nyata memakai store yang sama. Bedakan kebijakan yang didukung PRD dari keputusan operasional yang masih terbuka. Uji lintas Kasir, Admin, Owner; cegah stok ganda, negatif dan akses antar-cabang. Ambil screenshot desktop/mobile, buat QA report lengkap. Jangan mulai Checkpoint 3. Kerjakan sampai selesai dan berhenti untuk review.

5. Minta OpenCode menunjukkan screenshot 3 halaman Owner baru dan penerimaan Admin, plus laporan test yang benar-benar dijalankan.

## Yang dikunci

- Empat halaman Owner CP1 dan seluruh desain Kasir/Admin.
- Existing routes, sharedStore, BRANCHES, centralStock, data pengguna.
- Role scope sesuai PRD; alokasi dilakukan Owner dan penerimaan fisik dilakukan Admin Cabang.

## Keputusan bisnis yang perlu dijelaskan dalam laporan

- Saat mana stok Pusat benar-benar dikurangi (alokasi, dispatch, receipt)?
- Siapa berwenang menandai barang sebagai dispatched jika ada tahapan kirim?
- Bagaimana jika jumlah diterima kurang/rusak/hilang?
- Apakah pengajuan boleh ditolak/dibatalkan dan oleh siapa?
- Bagaimana partial receipt dan revisi alokasi yang sedang berjalan?

**OpenCode tidak boleh menyamakan asumsi teknis dengan kebijakan resmi PRD.** Tahap ini boleh menghasilkan subflow aman dan menandai unsur yang memerlukan keputusan. Belum ada integrasi supplier.
