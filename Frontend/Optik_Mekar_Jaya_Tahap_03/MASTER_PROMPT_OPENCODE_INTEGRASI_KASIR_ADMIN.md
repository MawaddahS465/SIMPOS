# MASTER PROMPT OPENCODE — SIMPOS OPTIK MEKAR JAYA
## TAHAP 03 | Integrasi Kasir dan Admin Cabang, Regression & Cross-Role QA

> **Peran Anda:** Senior Full-Stack Engineer, Database/Integration Engineer, QA Automation Engineer, dan Visual Regression Engineer. **Kerjakan langsung di repository yang sudah ada**, bukan membuat demo/proyek baru.
>
> **Status dari pemilik project:** UI/fitur Kasir sudah selesai; Admin Cabang dikerjakan pada Tahap 01–02. **Status implementasi Admin perlu diverifikasi dari source code dan tes—jangan diasumsikan selesai.**

## A. Tujuan dan kriteria hasil

Selesaikan integrasi data dan proses bisnis **Kasir ↔ Admin Cabang** dalam aplikasi SIMPOS Optik Mekar Jaya, tanpa mengubah identitas visual lavender pastel atau merusak flow lama yang sudah berjalan. Setelah integrasi, kejadian nyata pada satu role harus terbaca dengan benar pada role lain sesuai hak akses dan cabangnya:

1. Admin membuat/memperbarui master **frame dan lensa**; katalog Kasir menampilkan data produk yang sama, termasuk harga dan stok **cabang aktif**.
2. Kasir membuat **PO** terkait pelanggan, produk, resep tersimpan dan snapshot ukuran lensa; Admin Cabang yang sesuai dapat melihat dan memproses pesanan itu. Perubahan status terpantau Kasir.
3. Admin mencatat **penerimaan barang yang benar-benar diterima**; stok cabang bertambah *sekali*, dan katalog Kasir diperbarui.
4. Kasir menyelesaikan transaksi yang berhasil dibayar; stok cabang berkurang *sekali*, transaksi dan mutasi tercatat, lalu terlihat pada ringkasan Admin sesuai izin.
5. Minimum stok dan status **Stok Menipis** konsisten di semua tampilan terkait; pengajuan kebutuhan dari Admin tercatat untuk proses Pemilik di tahap mendatang.
6. Tidak ada akses lintas-cabang maupun pelanggaran pembagian kewenangan Kasir/Admin.
7. UI desktop dan mobile **tetap menggunakan design system yang sudah disetujui**; jangan redesign, jangan menambah dashboard/halaman yang tidak diperlukan.
8. Ada bukti nyata: migration/data contract, test lintas-role otomatis, screenshot visual, serta laporan pass/fail berbasis pengujian.

## B. Baca dan audit sebelum coding

1. Jalankan `pwd`, tinjau struktur repo, `package.json`/composer/config, router, data models, stores, API/services, auth/session, tests, migration, `README`, dan status Git. Gunakan nama file/path sesuai **repo aktual**, jangan mengira-ngira.
2. Cari dan baca file berikut **jika ada**: PRD Kasir, PRD Admin Cabang, Project Charter/analisis kebutuhan SIMPOS, master prompt Tahap 01–02, dan screenshot referensi final.
3. Temukan implementation sebenarnya: **frontend-only (localStorage/demo store) atau backend nyata (misalnya CI4/MySQL, Supabase, dll.)**. Dokumen sumber menyebut teknologi yang tidak seragam pada beberapa bagian; **jangan migrasi stack hanya karena PRD**. Pertahankan arsitektur repo yang berjalan kecuali ada kebutuhan nyata dan persetujuan pengguna.
4. Temukan seluruh sumber data `products`, `branchStocks`, `customers`, `prescriptions`, `purchaseOrders`, `sales`, `payments`, `stockMovements`, `stockRequests`, `receipts`, `users`, `branches`. Catat duplikasi sumber kebenaran, `mock data`, dan referensi yang tidak sinkron.
5. Periksa **Admin Tahap 01–02 memang sudah ada dan fungsional**. Bila belum, berhenti pada gap report berisi file/fitur yang kurang dan implementasikan hanya fondasi minimum yang dibutuhkan Tahap 03, tanpa mengarang modul Owner.
6. Buat `docs/stage-03/INTEGRATION_AUDIT.md`: arsitektur terdeteksi, matriks fitur yang sudah ada, celah integrasi, keputusan teknis, dan daftar risiko regresi.
7. Sebelum mengedit: gunakan branch Git `feat/stage-03-cashier-admin-integration` jika repository ber-Git, setelah cek perubahan lokal yang belum di-commit. **Jangan reset, force push, menghapus file, membuang perubahan pengguna, atau melakukan migrasi destruktif.** Buat langkah migrasi/backup yang bisa dibatalkan bila diperlukan.

## C. Batasan PRD (wajib)

### Kewenangan Kasir
- Login sesuai role/cabang.
- Melihat produk dan ketersediaan pada cabangnya (bukan mengubah produk, harga, atau saldo stok).
- Mengelola pelanggan dan menyimpan resep mata kanan/kiri, tanggal resep; pemeriksaan mata sendiri **di luar sistem**.
- Membuat PO pelanggan dan memantau status; pada PO lensa, pilih resep dan **simpan snapshot ukuran lensa dalam order** sehingga perubahan resep di kemudian hari tidak mengubah pesanan historis.
- Transaksi penjualan langsung atau berasal dari PO; metode tunai, transfer, QRIS, e-wallet sesuai dukungan yang **benar-benar terimplementasi**; nota/riwayat.
- Tidak dapat menerima barang, mengedit stok, mengganti harga master, mendistribusikan barang, atau memproses PO dengan otoritas Admin.

### Kewenangan Admin Cabang
- Login dan akses operasional **hanya cabang yang ditetapkan**, termasuk produk/stok, penerimaan, minimum stok, pemrosesan PO dan pengajuan kebutuhan barang.
- Mengelola master produk frame/lensa sesuai hak akses, dengan proteksi produk yang telah digunakan transaksi (hindari penghapusan permanen yang merusak riwayat; gunakan arsip/nonaktif jika perlu).
- Melihat PO dari Kasir **pada cabang yang sama**; mengonfirmasi detail resep dan memproses status sesuai proses bisnis.
- Mencatat barang yang benar-benar diterima dan riwayat perubahan stok. **Pengajuan stok tidak menambah stok otomatis.**
- Membuat permintaan stok kepada Pemilik; Admin **tidak menentukan sendiri jumlah alokasi pusat**.
- Tidak menjalankan transaksi kasir/checkout atau melihat data sensitif pelanggan yang tidak dibutuhkan untuk pemrosesan PO.

### Pemilik belum dikerjakan dalam tahap ini
- Persiapkan kontrak data `stockRequests` dan `distributionAllocations` bila struktur aplikasi memerlukannya, **tetapi jangan membuat Dashboard Pemilik palsu**.
- Distribusi dari pusat menurut PRD ditetapkan Pemilik. Bila tidak ada otorisasi Pemilik, tampilkan data alokasi demo **yang eksplisit berlabel seed/simulasi** dan jangan memberi Admin izin membuat keputusan Pemilik.
- Proses pembelian otomatis ke supplier, logistik pengiriman ke pelanggan, virtual try-on/3D, dan fitur di luar PRD **bukan cakupan Tahap 03**.

## D. Kontrak data dan source of truth

Audit skema lama, lalu tetapkan kontrak minimal berikut (sesuaikan penamaan dan field existing, jangan membuat tabel ganda jika sudah ada):

- `branches`: `id`, `name`, `is_active`.
- `users`: `id`, `role`, `branch_id`, identity/auth fields; Owner boleh cakupan semua cabang saat nanti dibuat.
- `products`: `id`, `sku`, `type` (`FRAME|LENS`), `name`, `category`, `sale_price`, `is_active`, optional image fields.
- `branch_stocks`: kombinasi unik `(branch_id, product_id)`, `qty_available`, `qty_minimum`, optional `version` untuk kontrol konkurensi.
- `customers`: `id`, `branch_id`/ownership policy yang disepakati, `name`, `phone`.
- `prescriptions`: `id`, `customer_id`, `exam_date`, right/left eye prescription fields yang digunakan di aplikasi.
- `purchase_orders`: `id`, `branch_id`, `customer_id`, `status`, `created_by`, timestamps.
- `purchase_order_items`: `po_id`, `product_id`, qty, price snapshot (jika relevan), **prescription snapshot** untuk pesanan lensa.
- `sales` + `sale_items`: `id`, `branch_id`, `cashier_id`, optional `po_id`, item snapshot, total, lifecycle.
- `payments`: sale reference, method, amount, provider reference, status, timestamps, **unique idempotency key**.
- `stock_movements`: `id`, `branch_id`, `product_id`, signed quantity delta, reason (`RECEIPT|SALE|ADJUSTMENT` hanya bila telah sah), reference type/id, actor, timestamp, **deduplication key**.
- `stock_requests`: cabang, pemohon, item, qty diminta, status, timestamps.
- `goods_receipts` (+ items): referensi alokasi/asal barang, branch, actual received qty, status, created_by, timestamps.
- `audit_logs`: actor, role, branch, action, entity, entity id, before/after ringkas, timestamp—**jangan log password/token/detail rahasia pembayaran**.

Nilai uang harus disimpan sebagai integer rupiah atau tipe decimal yang aman. Jangan hitung uang memakai floating-point JS tanpa mekanisme pembulatan yang benar. Timestamp server/UTC konsisten, tampilkan zona Indonesia pada UI jika relevan. Gunakan stable IDs/foreign keys, indeks penting, constraint non-negative stock, dan ownership branch.

Jika repo hanya frontend/localStorage, **jangan berpura-pura itu integrasi multi-user aman**. Boleh membuat adapter/repository abstrak agar demo dua role dalam *browser yang sama* sinkron, tetapi bila diminta integrasi lintas akun/perangkat nyata, membutuhkan backend/database dan otorisasi server. Jelaskan status dan jalur migrasinya, lalu implementasikan dengan stack repo jika backend memang tersedia.

## E. Urutan implementasi bertahap

### E1. Shared auth, routing dan RBAC
1. Satu mekanisme sesi yang dipakai Kasir dan Admin; redirect login menurut role.
2. Server-side authorization dan filtering branch untuk backend yang tersedia; UI hiding **bukan keamanan**.
3. User cabang A tidak dapat mengakses data cabang B melalui URL langsung atau API parameter yang dimanipulasi.
4. Kasir dilarang memanggil endpoint write admin walaupun UI disembunyikan, Admin dilarang endpoint checkout Kasir.
5. Uji expired session, logout, refresh, `403`, `404` dan user tak terotorisasi.

### E2. Master produk → katalog Kasir
1. Admin membuat/edit frame/lensa → Kasir cabang yang relevan membaca sumber data yang sama.
2. Harga dan label produk konsisten; transaksi lama memakai snapshot item/harga historis.
3. Filter produk aktif, stok pada cabang aktif, penanganan gambar kosong dan produk nonaktif.
4. Jangan mengubah desain kartu produk Kasir, kecuali bug data atau UX yang harus diperbaiki secara sangat terbatas.

### E3. PO Kasir → Admin Cabang → Kasir
1. Kasir buat PO dengan pelanggan, produk, qty, resep sesuai kebutuhan; status awal `Dipesan`.
2. Admin Cabang terkait menerima daftar PO baru, membaca ukuran lensa snapshot, mencatat perubahan ke `Diproses`, lalu `Sudah Datang` saat benar-benar sudah tersedia/diterima.
3. Kasir melihat pembaruan tersebut melalui refresh/refetch sesuai arsitektur; status tidak ditulis di dua storage terpisah.
4. PO terkait dengan satu proses transaksi/penyelesaian yang dapat ditelusuri; tidak boleh membuat dua transaksi untuk PO yang sama akibat double click/retry.
5. **Konflik redaksional PRD:** bagian kebutuhan fungsional menyebut Admin dapat memperbarui status sampai `Selesai`, sementara narasi To-Be menyebut Kasir menyelesaikannya setelah pembayaran dan pengambilan. Implementasikan aturan kerja sementara: Admin mengelola `Dipesan → Diproses → Sudah Datang`, Kasir menginisiasi penyelesaian setelah pembayaran dan serah terima, **tetapi tandai sebagai `NEEDS_CLIENT_APPROVAL`**. Jika repo sudah memiliki aturan final yang telah disetujui pengguna, pertahankan dan dokumentasikan; jangan menimpa secara diam-diam.
6. Perubahan status harus lewat service/state machine tervalidasi, ada pencatat aktor/waktu; blokir transisi ilegal/duplikat.

### E4. Penerimaan barang → stok cabang → Kasir
1. Admin hanya memproses penerimaan atas barang yang benar-benar diterima; referensi distribusi dari Pemilik/pusat jika tersedia.
2. Periksa kuantitas `> 0`, produk valid, cabang cocok dan status belum diterima.
3. Satu transaksi database mengubah receipt, branch stock, dan stock movement; rollback semua jika salah satu gagal.
4. Simpan idempotency/unique constraint agar klik Simpan berulang tidak menggandakan stok.
5. Setelah selesai, admin melihat stok terbaru dan kasir melihat qty terbaru pada katalog.
6. Pengajuan kebutuhan stok hanya menciptakan *permintaan*, tidak otomatis menerima atau mengalokasikan barang.

### E5. Checkout Kasir → pembayaran → stok → Admin
1. Verifikasi stok cabang saat finalisasi di sumber data otoritatif; jangan percaya stok yang dikirim browser saja.
2. Untuk transaksi yang sah dan dibayar berhasil, catat sale, payment, mutasi SALE, dan update stok dalam unit yang konsisten, atomik/terkoordinasi sesuai arsitektur.
3. Cegah stok negatif dan race condition dua Kasir membeli item terakhir secara bersamaan.
4. `PENDING`, `FAILED`, `CANCELLED` atau retry pembayaran **tidak boleh mengurangi stok ulang**.
5. Payment gateway: terima status terverifikasi dari server/callback/webhook yang authenticated bila ada integrasi nyata. Jangan menganggap redirect browser sama dengan pembayaran berhasil. Bila masih demo, tampilkan label simulasi.
6. Riwayat Kasir, nota, dan informasi stok Admin harus membaca data final yang sama. Jika pembayaran sudah tercatat sukses tetapi proses stok gagal, laporkan dan lakukan penanganan konsistensi sesuai arsitektur; jangan diam-diam menyatakan sukses palsu.
7. Buat aturan yang eksplisit terhadap PO (apakah barang reserved, kapan stok fisik dikurangi, apa yang terjadi bila lensa dibuat khusus) agar tidak double decrement antara penerimaan, PO dan pelunasan. **Jangan mengasumsikan reservasi atau DP didukung bila tidak ada di PRD / app.**

### E6. Stok minimum dan pengajuan
1. `Stok Menipis` ketika `qty_available <= qty_minimum`.
2. Setelah penjualan/penerimaan, status stok dihitung ulang dan UI Admin memperbarui.
3. Pengajuan kebutuhan dicatat dengan cabang, produk, qty, alasan opsional, status. Owner baru meninjau tahap berikutnya.
4. Blokir pengajuan duplikat tidak disengaja dengan kebijakan yang terdokumentasi; jangan otomatis menyetujui permintaan sebagai Admin.

### E7. Observability, migrations dan rollback
1. Audit trail aksi kritis: pembuatan PO, transisi PO, penerimaan, transaksi dibayar, stok bergerak, perubahan harga.
2. Migration aman terhadap data yang sudah ada dan seed data demo terpisah dari data nyata.
3. Jangan hard-delete order atau mutasi stok yang menjadi histori.
4. Catat referensi transaksi untuk rekonsiliasi; berikan panduan backup/restore sesuai stack.

## F. MATRIKS PENGUJIAN WAJIB

Buat automated tests sesuai stack (unit, integration/API, E2E Playwright/browser) dan file `qa/stage-03/CROSS_ROLE_TEST_MATRIX.md`. **Minimal jalankan**:

| ID | Kasus uji lintas-role | Hasil yang wajib |
|---|---|---|
| INT-01 | Login akun Kasir dan Admin pada cabang A | Dashboard, menu, hak akses sesuai masing-masing |
| INT-02 | Kasir akses route/API edit produk | Ditolak dengan otorisasi yang sesuai |
| INT-03 | Admin akses route/API checkout Kasir | Ditolak |
| INT-04 | Admin A membuka/mengubah data cabang B | Ditolak; data tidak bocor |
| INT-05 | Admin tambah frame harga Rp250.000, stok 5 di A | Katalog Kasir A tampil nilai sama; cabang B tidak berubah tanpa dasar |
| INT-06 | Admin ubah harga menjadi Rp275.000 | Katalog berubah, nota transaksi lama tetap mempertahankan harga historis |
| INT-07 | Kasir A membuat PO untuk pelanggan + resep mata OD/OS | Admin A dapat melihat dan detail snapshot resep benar |
| INT-08 | Admin memproses PO Dipesan → Diproses → Sudah Datang | Kasir A melihat perubahan; Admin B tidak punya akses |
| INT-09 | Update resep pelanggan setelah PO dibuat | Resep historis di PO tidak berubah |
| INT-10 | Admin terima 3 item satu kali | Stok A 5 → 8 dan tepat satu mutasi RECEIPT |
| INT-11 | Klik terima dua kali/retry permintaan identik | Stok tetap 8; tidak ada dua mutasi |
| INT-12 | Kasir jual 2 item dan pembayaran sukses | Stok A 8 → 6, satu SALE dan satu mutasi transaksi |
| INT-13 | Retry callback pembayaran sukses / klik bayar dua kali | Stok tetap 6, transaksi tidak diduplikasi |
| INT-14 | Pembayaran gagal/pending | Tidak ada pengurangan stok final yang salah |
| INT-15 | Dua Kasir membeli stok terakhir secara bersamaan | Tidak overselling dan tidak negatif |
| INT-16 | Stok 2, minimum 2 | Status Stok Menipis terlihat pada Admin |
| INT-17 | Admin ajukan tambahan 10 item | Permintaan tercatat; stok tidak otomatis +10 |
| INT-18 | PO Sudah Datang dibayar lalu diserahkan | Status final/tautan transaksi mengikuti aturan yang disetujui; satu transaksi |
| INT-19 | Logout, sesi kedaluwarsa, refresh, direct URL | Hak akses tetap benar |
| INT-20 | Data transaksi/PO stok setelah reload | Persisten menurut arsitektur nyata yang diimplementasikan |
| INT-21 | Kesalahan saat tengah transaksi stok | Rollback/konsistensi, tidak ada mutasi setengah tersimpan |
| INT-22 | Produk nonaktif / data kosong / jaringan gagal | Pesan UI sesuai, tanpa crash |
| INT-23 | Semua layar utama Kasir yang sudah jadi | Regression test berhasil, screenshot tidak melenceng signifikan |
| INT-24 | Semua layar utama Admin Tahap 01–02 | Regression test berhasil, visual konsisten |

Untuk setiap test, catat `PASS/FAIL/BLOCKED`, alasan, file/log/screenshot bukti, serta cara reproduksi. Gunakan dataset yang jelas seed/demo; jangan pakai pelanggan nyata pada artefak screenshot.

## G. Visual regression dan responsivitas — jangan merusak hasil sebelumnya

1. **Larangan redesign:** Pertahankan warna lavender, gradien, sidebar, card, ikon, banner, header, typography, spacing, login dan navigasi yang sudah disetujui.
2. Sebelum mengubah komponen shared, ambil screenshot **baseline** Kasir dan Admin pada viewport `1536×1024`, `1440×900`, `768×1024`, dan `390×844`, jika browser automation tersedia. Ambil screenshot sesudah perubahan pada viewport yang sama.
3. Bandingkan posisi, proporsi, typography, overflow, wrapping, kontras, modal dan drawer. Jangan mengubah Kasir untuk menyamakan Admin jika Kasir sudah final.
4. Hasilkan screenshot: Login Kasir, Dashboard Kasir, Transaksi Baru, Checkout, PO Kasir, Login Admin, Dashboard Admin, Produk Admin, Stok Admin, Penerimaan Admin, PO Admin, Pengajuan Stok.
5. Lakukan review manual area berbeda dan dokumentasikan. Jika referensi Admin final belum ada, laporkan bahwa pengecekan Admin adalah *konsistensi terhadap design system*, bukan klaim pixel-perfect.
6. **Jangan pakai screenshot sebagai background halaman**, atau mengorbankan semantik, interaksi, keterbacaan dan responsive demi kemiripan palsu.

## H. Alur kerja OpenCode yang harus diikuti

**Checkpoint 0 — Audit & laporan singkat.** Tinjau repo dan tulis temuan. Bila Admin Tahap 02 belum selesai atau backend tidak ada, jelaskan gap dengan bukti dan opsi terbaik sebelum membuat klaim integrasi penuh.

**Checkpoint 1 — Data foundation + auth/RBAC.** Konsolidasikan source of truth, migrasi aman dan batas peran/cabang. Jalankan tes RBAC.

**Checkpoint 2 — Produk + PO.** Uji Admin mengubah produk → Kasir melihat; Kasir buat PO → Admin memproses → Kasir memantau.

**Checkpoint 3 — Stok + pembayaran.** Uji penerimaan → stok → katalog, checkout → stok → laporan mutasi; idempotency dan konkurensi.

**Checkpoint 4 — Full regression.** Jalankan test suite, browser E2E, responsivitas, screenshot comparison, bangun output production/dev sesuai repo.

**Checkpoint 5 — Laporan final.** Beri status sebenarnya, tautan/path file laporan, cara uji, penjelasan keterbatasan. Jangan klaim semua PASS jika tes tidak dijalankan.

## I. Deliverables

Buat di repo (sesuaikan dengan struktur yang sudah ada):

- `docs/stage-03/INTEGRATION_AUDIT.md`
- `docs/stage-03/DATA_CONTRACT.md`
- `docs/stage-03/ROLE_PERMISSION_MATRIX.md`
- `docs/stage-03/PO_STATE_MACHINE.md`
- `docs/stage-03/INTEGRATION_DECISIONS.md` (tandai konflik kebijakan PO `Selesai`, payment gateway dan stok PO)
- `qa/stage-03/CROSS_ROLE_TEST_MATRIX.md`
- `qa/stage-03/VISUAL_REGRESSION.md`
- `qa/stage-03/screenshots/` (hasil aktual, bukan mockup AI)
- Automated test files sesuai struktur repo
- Migration dan seed demo yang aman apabila benar-benar diperlukan
- Ringkasan perubahan, perintah menjalankan, hasil build/test, dan daftar risiko yang tersisa

## J. Aturan berhenti dan klaim kualitas

Jangan menyatakan Tahap 03 selesai bila:
- Admin belum benar-benar bisa membaca PO Kasir dari sumber data yang sama.
- Master produk/harga/stok masih terpisah antara Kasir dan Admin tanpa sinkronisasi.
- Penjualan/penerimaan stok bisa tercatat dua kali atau menghasilkan stok negatif.
- Kasir/Admin bisa mengakses data cabang lain atau fungsi terlarang.
- Belum ada test antar-role yang benar-benar dijalankan.
- Kasir yang sudah jadi mengalami regresi visual atau alur bisnis.
- Backend nyata belum ada, tetapi laporan mengklaim integrasi antarperangkat atau keamanan RBAC produksi.

Jika pengujian atau backend belum tersedia, tulis `BLOCKED` dengan alasan dan langkah lanjut konkret. **Jangan memalsukan screenshot, status PASS, hasil test, maupun implementasi payment gateway.**

**MULAI SEKARANG:** Audit project aktif, telusuri implementasi nyata Tahap 01–02, buat checkpoint report, kemudian kerjakan integrasi Kasir–Admin Cabang secara bertahap sampai didukung pengujian. Jangan sekadar memberikan rencana.
