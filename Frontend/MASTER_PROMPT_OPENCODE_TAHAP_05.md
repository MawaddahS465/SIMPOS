# SIMPOS OPTIK MEKAR JAYA — TAHAP 05
## Decision Review, Business Policy Ratification & Change-Impact Planning

**Mandat:** Bertindak sebagai Lead Business Analyst, Product Owner Support, Inventory Domain Analyst, Financial Operations Analyst, Security Architect, dan QA Lead. Lanjutkan **repository SIMPOS yang sama**. Tugas Tahap 05 adalah menelaah 14 keputusan bisnis yang telah tercatat, merumuskan alternatif dan rekomendasi, memperoleh konfirmasi pemilik proses bisnis, serta menyiapkan rencana perubahan — BUKAN menerapkan keputusan yang belum disahkan.

### KONTEKS YANG HARUS DIAUDIT, BUKAN DIANGGAP TERBUKTI
- Laporan Checkpoint 4 sebelumnya menyatakan 99/99 pengujian PASS (33+9+29+14+14), typecheck bersih, 66 screenshot, 0 overflow/error. Jalankan ulang pengujian untuk baseline bila memungkinkan; jangan menyalin label PASS tanpa bukti eksekusi.
- 3 role: Kasir, Admin Cabang, Pemilik, menggunakan `sharedStore` prototype. Laporan CP4 menyatakan belum ada keamanan backend produksi.
- Design system lavender pastel, layout, navigasi, tipografi dan seluruh halaman Kasir/Admin/Owner Checkpoint 0–4 **DIKUNCI**.
- Beberapa keputusan stok/pembayaran/PO masih sengaja ditunda untuk mencegah perubahan tanpa persetujuan.
- User telah menyetujui tampilan; jangan mengulang review desain.

### 0 — READ-ONLY AUDIT (SEBELUM MENULIS)
Baca secara menyeluruh di repository, periksa path aktual dan laporkan jika tidak ada:
1. `docs/final/OPEN_BUSINESS_DECISIONS.md` — **sumber utama yang wajib memuat persis 14 keputusan**.
2. `docs/final/FINAL_AUDIT.md`, `REQUIREMENT_TRACEABILITY.md`, `SECURITY_AUDIT.md`, `DEPLOYMENT_READINESS.md`.
3. `docs/stage-04/CP2_OPEN_DECISIONS.md`, `CP3_OPEN_DECISIONS.md`, serta QA/implementation logs CP1–CP3.
4. PRD/Project Charter Kasir, Admin Cabang, Pemilik yang berada di repo.
5. Source aktual domain PO, payment, stock, distribution, allocation, request, receipt, ledger, report, accounts/roles, branches, sharedStore; dan test suites.

**STOP CONDITION:** Bila `OPEN_BUSINESS_DECISIONS.md` tidak ditemukan atau tidak bisa dibaca, jangan karang daftar 14. Tampilkan error path dan minta file asli. Jika jumlah item tidak tepat 14, tampilkan jumlah sebenarnya, ID, perbedaan, dan minta klarifikasi. Jangan diam-diam menggabungkan atau menciptakan entri.

### 1 — PEMETAAN 14 KEPUTUSAN
Pertahankan ID, judul, redaksi, urutan, dan rujukan untuk **setiap** dari 14 keputusan dari dokumen asli. Buat matriks dengan kolom:
- ID asli dan topik asli.
- Kutipan relevan PRD, path + heading/baris bila tersedia.
- Perilaku IMPLEMENTASI SEKARANG yang dibuktikan via source/test.
- Status: `EXPLICIT_PRD`, `CONFLICTING_PRD`, `NO_PRD_POLICY`, `TECHNICAL_GAP` (satu/lebih sesuai kebutuhan).
- Dua atau tiga opsi realistis (A/B/C), kelebihan-kekurangan dan risiko.
- Rekomendasi ANALIS (bukan persetujuan klien), alasan, trade-offs.
- Dampak ke UI, workflow tiga role, ledger stok, transaksi, data/schema/API, RBAC, laporan, QA, migration bila relevan.
- Penanggung jawab keputusan bisnis (Owner toko/pihak terkait), prioritas P0/P1/P2 dan dependensi.
- Status keputusan: `PENDING_STAKEHOLDER`, `APPROVED_WITH_EVIDENCE`, `REJECTED_WITH_EVIDENCE`, `DEFERRED`.
- Bukti approval: siapa, tanggal, referensi notulen/tanda tangan, alasan, dan versi policy.
Jangan pernah membuat status APPROVED tanpa bukti tertulis.

### 2 — TOPIK YANG DIKETAHUI DARI LAPORAN (HANYA UNTUK REKONSILIASI)
Laporan CP4 yang tersedia di percakapan menyebut: PO Selesai, debit stok Pusat, dispatch/in-transit, selisih penerimaan, pembatalan, approval pengajuan, master data, cabang kedua, template laporan, refund, HPP, manajemen akun, backend. **Itu 13 topik ringkasan, bukan daftar resmi 14 entri.** Temukan entri yang kurang dari file asli, jangan menebak. Deposit/DP, biaya gateway, pembayaran parsial, dan lifecycle supplier adalah isu yang mungkin terkait beberapa entri tetapi jangan otomatis ditetapkan sebagai item ke-14.

### 3 — LANDASAN PRD DAN KONFLIK YANG WAJIB DITANDAI
- Status PO: `Dipesan` → `Diproses` → `Sudah Datang` → `Selesai`. Dokumen kebutuhan memberikan Admin kemampuan memperbarui hingga Selesai, sedangkan narasi proses bisnis menggambarkan Kasir menangani pembayaran/pengambilan hingga penyelesaian. Tandai konflik; jangan pilih aktor sepihak.
- Distribusi: Pemilik menentukan alokasi; Admin Cabang mencatat penerimaan aktual; stok cabang bertambah berdasarkan penerimaan. Waktu debit stok pusat (alokasi/dispatch/receipt) belum final; jangan mengubah saldo pusat.
- Pengajuan stok tidak langsung mengubah saldo. Reservasi alokasi bukan mutasi fisik; `available = onHand − reserved` adalah perilaku prototype yang perlu direkonsiliasi dengan kebijakan fisik.
- Supplier purchasing serta pengiriman ke pelanggan di luar ruang lingkup. `dispatch` pusat-ke-cabang berbeda dari pengiriman ke pelanggan.
- Penjualan sukses mengurangi stok tepat sekali; pembayaran tunai/transfer/QRIS/e-wallet dicatat sesuai data yang tersedia. DP, refund, fee gateway dan pembatalan belum mempunyai aturan lengkap.
- Owner memantau semua cabang dan menentukan alokasi; bukan Kasir terselubung. Admin dan Kasir dibatasi ke cabang masing-masing.
- Dokumen teknologi memiliki rujukan CodeIgniter 4 + MySQL dan bagian lain React + Supabase; aplikasi prototype nyata yang ditemukan dari audit merupakan baseline. Jangan memilih/migrasi stack sendiri.

### 4 — USUL KEBIJAKAN (PENDING, BUKAN SPEC FINAL)
Gunakan usulan berikut **sebagai kandidat** untuk diskusi, bukan tindakan otomatis:
A. PO Selesai: Kasir memfinalkan setelah serah-terima dan pembayaran sesuai aturan; Admin berhenti pada Sudah Datang. Alternatif: Admin tetap mengubah Selesai dengan verifikasi Kasir. Butuh approval karena PRD ambigu.
B. Stok pusat: reservasi saat alokasi, debit fisik ketika dispatch terkonfirmasi, in-transit tetap tercatat sampai receipt. Alternatif saat receipt dengan kontrol konsinyasi/ownership; memerlukan keputusan domain.
C. Selisih: simpan qty diterima aktual, status discrepancy, siapa review, koreksi/retur dengan event terpisah dan audit.
D. Pembatalan: sebelum dispatch lepaskan reservasi; setelah dispatch proses retur/rekonsiliasi tersendiri. Jangan menghapus ledger historis.
E. Approval: Owner menetapkan jumlah bisa parsial dan memberi catatan; jika ingin status reject, perlu aturan resmi.
F. Master: produk/SKU bersama, saldo/minimum per cabang; kepemilikan harga dan penonaktifan produk perlu keputusan.
G. Akun: admin akun/Owner hanya sesuai otorisasi yang disahkan; least privilege. Owner tidak otomatis menjadi superuser transaksi.
H. Laporan: approved template, definisi omzet vs pembayaran dan batasan informasi sensitif.
I. Refund, DP, fee, HPP: jangan membuat alur kas/refund atau mengklaim laporan laba tanpa kebijakan/biaya yang sah.
J. Backend: buat Architecture Decision Record dan proposal pilihan tanpa mengubah stack/menambah backend.

### 5 — DOKUMEN YANG HARUS DIHASILKAN
Tanpa mengedit file historis OpenCode/PRD original, tambahkan hanya dokumen baru:
- `docs/stage-05/00_SOURCE_AUDIT.md` — 14 entri asli + sumber/konflik + evidence.
- `docs/stage-05/01_DECISION_REGISTER.md` — **14 baris persis**, ID asli, opsi/rekomendasi/status default PENDING.
- `docs/stage-05/02_STAKEHOLDER_QUESTIONNAIRE.md` — pertanyaan sederhana berbahasa Indonesia untuk Owner Optik Mekar Jaya, per item opsi A/B/C.
- `docs/stage-05/03_POLICY_RECOMMENDATIONS.md` — opsi, ilustrasi alur, risiko & rekomendasi teknis dengan label BELUM DISETUJUI.
- `docs/stage-05/04_APPROVAL_SHEET.md` — ruang tanda tangan/nama/tanggal/versi policy setiap item; **jangan isi persetujuan palsu**.
- `docs/stage-05/05_CHANGE_IMPACT_AND_BACKLOG.md` — file/module affected, migration readiness, feature flags, negative tests, dependency order.
- `docs/stage-05/06_BASELINE_PROTECTION.md` — daftar source assets UI tersetujui, hash/screenshot baseline, test commands/status.
- `docs/stage-05/07_HANDOFF.md` — ringkasan untuk pengguna nonteknis dan tepat 14 item pending/approved sesuai bukti.

Jangan membuat tampilan baru untuk manajemen approval jika tidak diminta. Tahap 05 = dokumentasi, klarifikasi kebijakan, dan impact assessment.

### 6 — GATES DAN LARANGAN KERAS
- **Tidak boleh** mengubah kode bisnis, migration, seed, sharedStore, permission, stok pusat, status PO, pembayaran, laporan, maupun UI pada Tahap 05.
- **Tidak boleh** melakukan deployment, mengaktifkan payment gateway, membuat backend baru, menciptakan kebijakan sepihak, atau mengubah data pengguna.
- **Tidak boleh** menulis `APPROVED` tanpa evidence pemilik bisnis; permintaan pengguna untuk menyiapkan finalisasi **bukan** bukti bahwa 14 opsi telah disahkan.
- Simpan rekomendasi di dokumen dengan status `PROPOSED/PENDING`; bila keputusan bertentangan atau belum lengkap, tandai `BLOCKED_FOR_IMPLEMENTATION`.
- Jika tidak ditemukan source bisnis lengkap, STOP sebelum analisis dan minta dokumen yang hilang.
- Perbaikan bug tidak dilakukan di tahap ini tanpa konfirmasi scope baru. Jika ditemukan bug, catat tiket saja.

### 7 — BASELINE QA, BUKAN FITUR BARU
Bila environment memungkinkan, jalankan ulang semua suite (sebelumnya dilaporkan 33+9+29+14+14), typecheck, dan bandingkan status dengan audit CP4. Dokumentasikan versi Git/hash, tanggal, command, output aktual, jumlah PASS/FAIL/BLOCKED/NOT RUN. Karena source tidak boleh diubah, hasil baseline diharapkan tetap, tetapi jangan klaim PASS jika tool tidak dieksekusi. Pastikan 66 screenshot lama tidak dioverwrite.

### 8 — OUTPUT TERAKHIR DAN STOP
Tampilkan kepada pengguna:
1. 14 item yang **betul-betul** dibaca dari dokumen asli, dengan ID/judul asli.
2. Ringkasan pilihan/rekomendasi dan dampak paling kritis.
3. Perbedaan antara fakta PRD, implementasi sekarang, dan proposal analis.
4. Matriks dependensi + rencana penerapan **setelah** approval.
5. Daftar keputusan yang masih memerlukan persetujuan beserta format konfirmasi.
6. Hasil baseline test aktual serta daftar file dokumentasi yang ditambah.

**BERHENTI setelah menghasilkan paket review. Jangan melaksanakan keputusan, mengubah UI, masuk Tahap 06, atau deployment.**
