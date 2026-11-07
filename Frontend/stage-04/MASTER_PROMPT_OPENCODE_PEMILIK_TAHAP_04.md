# MASTER PROMPT OPENCODE — SIMPOS OPTIK MEKAR JAYA
## TAHAP 04 — ROLE PEMILIK, KONSOLIDASI MULTI-CABANG, DISTRIBUSI STOK & LAPORAN

> **Untuk OpenCode:** Bertindak sebagai Senior Full-Stack Engineer, UI Engineer, Database/Integration Engineer, dan QA Automation Engineer. **Kerjakan langsung pada repository SIMPOS yang telah dipakai Kasir dan Admin Cabang. JANGAN buat aplikasi atau repository baru.**
>
> **Kondisi yang diberitahukan pengguna:** Kasir sudah selesai; Admin Cabang dan integrasi Kasir–Admin merupakan tahapan sebelumnya. Jangan mengasumsikan Tahap 03 sudah lulus sampai diaudit langsung melalui source code dan pengujian.
>
> **Penting:** PRD Pemilik terlampir merupakan draft untuk validasi. Bedakan requirement eksplisit, rekomendasi kontrol teknis, dan keputusan bisnis yang belum disetujui.

---

## A. KONTRAK PENUGASAN DAN HASIL AKHIR

Integrasikan role `OWNER/PEMILIK` ke satu aplikasi SIMPOS Optik Mekar Jaya, sehingga Pemilik bisa:

1. Login dengan akun Pemilik dan mengakses **data pusat dan seluruh cabang**, tanpa fitur operasional Kasir/Admin yang tidak berwenang.
2. Memantau dashboard konsolidasi dengan sumber data yang sama seperti transaksi Kasir, stok Admin, PO, dan pengajuan.
3. Melihat rincian cabang, stok frame/lensa, stok menipis, pemesanan/PO, transaksi, pembayaran, penerimaan dan mutasi barang.
4. Melihat pengajuan kebutuhan barang dari Admin Cabang dan menentukan alokasi jumlah produk dari **stok pusat** ke cabang yang meminta.
5. Membuat alokasi tercatat serta dapat ditindaklanjuti Admin Cabang; penerimaan fisik dicatat oleh Admin Cabang, bukan otomatis dianggap diterima.
6. Memfilter laporan stok, penjualan/pembayaran, PO dan aktivitas barang berdasarkan cabang, jenis produk dan periode; mengekspor PDF dan Excel dengan hasil konsisten terhadap filter.
7. Menggunakan website responsif dengan design system lavender pastel yang sama seperti Kasir/Admin, tanpa mengubah komponen yang sudah disetujui.
8. Mendapat artefak pengujian nyata: unit/integration/E2E, screenshot desktop/mobile, matriks UAT, serta laporan perubahan dan keputusan tertunda.

### Aturan stop-the-line
Bila Tahap 03 ternyata belum siap, buat `docs/stage-04/BASELINE_AUDIT.md` dan catat blocker riil. Perbaiki hanya dependency minimal yang diperlukan, secara non-destruktif, tanpa mengklaim integrasi 3 role selesai ketika belum ada bukti. Jika masalah mendasar memerlukan migrasi data destruktif atau penentuan kebijakan bisnis baru, **minta keputusan pengguna terlebih dahulu**.

---

## B. SUMBER KEBENARAN DAN PRIORITAS

1. `stage-04/docs/PRD_SIMPOS_Optik_Mekar_Jaya_Pemilik.pdf` — acuan kebutuhan role Pemilik (OWN-01..OWN-12).
2. PRD Kasir/Admin, implementasi dan hasil pengujian Tahap 03 **jika ada di repository** — acuan kontrak data dan integrasi existing.
3. Source code aktual: routing, auth, services, models, migrations, seed, UI components, API dan tests.
4. `stage-04/references/` — **referensi bahasa visual saja**, bukan contoh dashboard Pemilik final. Utamakan komponen/desain Kasir dan Admin yang sudah disetujui pada repo pengguna.
5. Catatan keputusan/approval bisnis yang benar-benar sudah tercatat di repo. **Jangan asumsikan keputusan ambigu sudah final.**

### Konflik teknologi pada dokumen
Dokumen sumber memuat dua pilihan teknis berbeda: HTML/CSS/JS + Bootstrap, CodeIgniter 4 + MySQL versus React + Supabase. Jangan mengubah framework/backend saat Tahap 04 hanya karena salah satu tertulis di dokumen. Audit arsitektur yang sedang digunakan, lalu integrasikan secara konsisten di sana.

---

## C. AUDIT REPO SEBELUM CODING

Jalankan pemeriksaan nyata terlebih dahulu:

1. `pwd`, `git status`, struktur folder, konfigurasi build, package/dependency, router dan CSS/design tokens.
2. Deteksi mekanisme login dan role resolution; pastikan Kasir/Admin tidak hanya berbagi UI tetapi menggunakan sumber data yang sesuai.
3. Cari entitas/layanan: cabang/lokasi pusat, products, branch stock, stock requests, allocations, goods receipts, stock movements, purchase orders, sales, payment, audit logs, reports.
4. Identifikasi metode penyimpanan: localStorage demo, server API/backend nyata, database dan migration. Beri label **DEMO** bila belum ada backend otoritatif. localStorage lintas tab/browser tidak setara integrasi multi-user sebenarnya.
5. Periksa guard frontend **dan** middleware/policy backend; penyembunyian tombol tidak cukup untuk RBAC bila ada backend.
6. Jalankan baseline tests Kasir/Admin yang tersedia; buat catatan pass/fail aktual, screenshot baseline dan `docs/stage-04/BASELINE_AUDIT.md`.
7. Buat git branch `feat/stage-04-owner-role` jika repo menggunakan Git dan keadaan kerja aman. Jika ada perubahan belum di-commit, jangan hilangkan/overwrite; komunikasikan rencana edit. Jangan `git reset --hard`, `force push`, hapus data, atau migrasi destruktif.
8. Buat peta file mana yang akan ditambahkan versus disentuh; minimalkan perubahan pada halaman Kasir/Admin.

**Checkpoint A:** Setelah audit, tulis temuan arsitektur, bukti Tahap 03, daftar blocker dan daftar keputusan terbuka. Lanjut implementasi hanya bila aman.

---

## D. ROLE-BASED ACCESS CONTROL (RBAC) DAN CABANG

Role yang dikenal: `CASHIER/KASIR`, `BRANCH_ADMIN/ADMIN_CABANG`, `OWNER/PEMILIK` — **sesuaikan penamaan role dengan kode existing**. Buat mapping terpusat; jangan ada dua string berbeda yang menyebabkan salah izin.

- **Kasir:** kelola pelanggan, resep, PO; mencatat penjualan/pembayaran; lihat katalog stok cabang sesuai izin. Tidak dapat mengalokasikan stok pusat atau membuka data cabang lain.
- **Admin Cabang:** kelola frame/lensa sesuai scope, minimum stok dan barang masuk cabangnya, memproses PO dan membuat pengajuan stok. Tidak dapat menetapkan alokasi atas nama Pemilik atau mengakses cabang lain.
- **Pemilik:** baca ringkasan pusat dan seluruh cabang; pantau transaksi/pembayaran/PO/stok; tinjau pengajuan; **tetapkan jumlah alokasi distribusi pusat→cabang**; lihat dan ekspor laporan. **Tidak** diberi fitur buat transaksi Kasir, ubah transaksi, mengubah status PO, mengedit resep, atau menetapkan peran pengguna jika belum ada approval.

Implementasikan:

1. Login existing dengan redirect Owner → `/owner/dashboard` (atau pola prefix routing existing yang setara).
2. Protected route/layout khusus Owner dan server authorization bila backend ada.
3. Hanya role Owner yang boleh memanggil endpoint create allocation/owner report; cabang A/B disaring dari sumber data otoritatif.
4. Owner dapat `all branches` / `single branch` pada monitoring, tidak harus terikat satu branch ID.
5. Uji langsung URL/API yang dimanipulasi dan akses 403/401 setelah logout.
6. Jangan menambah dropdown switch-role bebas pada akun non-Owner atau endpoint impersonasi tanpa izin eksplisit.
7. Jangan mengekspos seluruh data pribadi pasien/resep di dashboard Owner; hanya data yang relevan dengan monitoring PO dan izin, hindari data medis sensitif berlebih di laporan.

---

## E. DESAIN UI/UX — KONSISTEN DENGAN KASIR DAN ADMIN

### Prinsip wajib
- **Satu design system**: lavender pastel / violet accents, white/light surfaces, dark navy text, rounded soft cards, subtle border & shadows, airy spacing, typography dan ikon konsisten.
- Gunakan `Sidebar`, `Topbar`, `Card`, `Badge`, `Table`, `FilterBar`, `Drawer`, `EmptyState`, `Modal`, `DateRange` yang sudah ada bila reusable. Jika perlu refactor, jaga tampilan Kasir/Admin.
- Jangan mengubah wallpaper, warna utama, font, hero, sidebar, atau layout Kasir/Admin yang sudah diterima.
- Dashboard Pemilik **minimalis tetapi informatif**: prioritaskan angka utama yang dapat diklik, antrian permintaan dan daftar cabang. Grafik besar hanya bila membantu, tidak memaksakan desain penuh KPI dan chart.
- Detail Owner sering berupa monitoring: tabel dan filter seharusnya lebih dominan daripada kartu katalog.
- Tidak boleh screenshot sebagai background palsu. Foto/kartu referensi hanya dipakai sesuai lisensi/ketersediaan dan fungsi.

### Responsivitas wajib
- Desktop 1536×1024 sebagai viewport visual utama.
- Desktop 1280×800, tablet 768×1024, mobile 390×844 dan 375×812.
- Pada mobile: sidebar drawer; tabel panjang gunakan responsive table pattern atau scroll horizontal **di dalam kontainer** dengan petunjuk; viewport utama tidak boleh overflow horizontal.
- Status, filter, CTA, dan label tetap terbaca dan dapat dioperasikan keyboard; state loading/error/empty/confirm tersedia.

### Approval visual
Belum ada screenshot final Owner yang telah disahkan. `stage-04/references/` merupakan visual anchor **Kasir**, bukan target pixel-perfect untuk Owner. Setelah checkpoint pertama, hasil Owner harus discreenshot dan disajikan untuk persetujuan. Jangan mengklaim pixel-perfect terhadap mockup Owner yang belum tersedia.

---

## F. INVENTARIS LAYAR PEMILIK (SESUAI PRD)

### O01. LOGIN PEMILIK
- Gunakan mekanisme login existing; jika login bersama role-based, **tidak membuat login baru** kecuali jelas diperlukan.
- Pesan error tidak membocorkan kredensial/keberadaan akun; session expiry/log out konsisten.

### O02. DASHBOARD PEMILIK
- Headline jelas, filter `Semua Cabang` / satu cabang dan periode.
- 3–4 summary yang paling bernilai, misalnya total transaksi sukses, PO aktif, stok menipis, pengajuan menunggu review; metrik harus berasal dari data sebenarnya.
- Daftar singkat pengajuan baru dan navigasi ke rincian.
- Ringkasan cabang yang dapat dibuka; ringkasan aktivitas barang bila muat.
- Gunakan angka real sesuai data; bila dataset kosong tampilkan empty state, **jangan membuat angka random**.
- Semua ringkasan menghormati filter branch dan periode; statistik stok adalah snapshot tanggal kini, bedakan dengan flow periode bila dibutuhkan.

### O03. MONITORING CABANG
- Daftar pusat/cabang sesuai izin; pusat dilabeli `Pusat`, bukan cabang penjualan kecuali data menunjukkan demikian.
- Setiap cabang: nama, status, stok ringkas, penjualan sukses, PO aktif, permintaan stok.
- Klik untuk detail yang terfilter cabang dan bisa kembali ke semua cabang.
- **Tidak** tambahkan CRUD cabang karena sumber tidak menetapkan hak itu.

### O04. MONITORING STOK LINTAS LOKASI
- Frame & Lensa sebagai tipe berbeda; daftar stok `lokasi + produk + qty tersedia + batas minimum + status`.
- Filter lokasi, jenis produk, stok menipis, pencarian, pagination.
- Status menipis bila `qty <= minimum` pada cabang (sesuai konfigurasi Admin). Stok pusat ditampilkan sesuai skema stok pusat.
- Owner read-only pada saldo/minimum; adjustment stok bukan hak Owner yang disetujui.

### O05. PENGAJUAN KEBUTUHAN BARANG
- Sinkron dari pengajuan yang dibuat Admin Cabang.
- List: nomor, cabang, produk, qty diminta, tanggal, status, rincian dan riwayat.
- Review detail beserta stok pusat/stock cabang saat ini dan pengajuan lain yang relevan.
- Hindari tombol `Tolak`, `Setujui penuh`, atau workflow approval mandiri jika kebijakan belum disepakati; tindakan utama yang sumber dukung adalah `Tentukan Alokasi`.
- Jika repo sudah punya status approval yang telah disetujui, pakai sesuai kontrak; catat asumsi dan tes.

### O06. ALOKASI DISTRIBUSI PUSAT → CABANG
- Owner memilih cabang tujuan, item frame/lensa, kuantitas dari pusat, serta pengajuan terkait jika ada.
- Validasi qty positif, lokasi sah, produk tersedia, tidak melebihi saldo pusat **yang dapat dialokasikan menurut kebijakan existing**.
- Catat `allocation_id`, aktor, sumber/tujuan, produk, jumlah, status, tanggal dan referensi pengajuan.
- Admin tujuan dapat melihat alokasi. **Admin Cabang tetap mencatat penerimaan fisik aktual.**
- Sebelum implementasi mutasi saldo pusat/stock in-transit, **pastikan kebijakan pengurangan stok** dari repo/client (saat dialokasi, dikirim, atau diterima). Jika tidak ada kebijakan, bangun pencatatan alokasi aman dan UI yang jelas, serta tandai stok dalam perjalanan sebagai keputusan terbuka. Jangan menambah/mengurangi stok pusat secara diam-diam.
- Cegah alokasi ganda saat double-click/retry, dan oversubscription bila dua Owner memproses stok pusat yang sama.
- Selisih qty diterima vs qty dialokasi: catat discrepancy dengan referensi, **jangan otomatis menormalisasi tanpa policy**.

### O07. MUTASI DAN DISTRIBUSI
- Daftar penerimaan, distribusi, SALE dan mutasi yang memang didukung repo; filter produk, lokasi, tanggal, alasan.
- Tampilkan `reference_id`, aktor, timestamp, lokasi, signed delta dan saldo bila tersedia.
- Tidak boleh membuat baris mutasi palsu dari estimasi/dashboard; sumbernya event/ledger nyata.

### O08. MONITORING TRANSAKSI DAN PEMBAYARAN
- Read-only atas transaksi Kasir pada semua cabang.
- Filter cabang, rentang tanggal, status, metode (tunai/transfer/QRIS/e-wallet sesuai data), pencarian transaksi.
- Bedakan `PENDING`, `FAILED`, `CANCELLED`, `PAID/SUCCESS` dari implementasi yang ada; total penjualan selesai berasal dari peristiwa yang sah bukan transaksi pending.
- Hindari menghitung pembayaran gateway yang sama berulang; jangan tampilkan detail kredensial gateway.
- JANGAN menyediakan `edit payment`, `refund` atau `delete sale` untuk Owner tanpa persetujuan requirement.

### O09. MONITORING PEMESANAN (PO)
- Read-only seluruh cabang; filter `Dipesan`, `Diproses`, `Sudah Datang`, `Selesai`, cabang, tanggal.
- Nomor PO, pelanggan (hanya informasi relevan), cabang, status, item, waktu, relasi transaksi final jika ada.
- Tidak boleh Owner memproses PO atau mengubah resep dari halaman monitoring.
- Redaksi tentang siapa menyelesaikan PO masih ambigu; **ikuti keputusan valid dari Tahap 03** bila ada, jangan ubah di Tahap 04.

### O10. LAPORAN DAN EKSPOR
- Tab/kategori: Laporan Stok, Penjualan/Pembayaran, PO, Penerimaan/Distribusi/Mutasi.
- Filter cabang, jenis produk dan periode: harian, mingguan, bulanan, tahunan, rentang tanggal inklusif.
- Angka ringkasan dan detail harus berasal dari query atau selector yang sama, tidak di-hardcode.
- **Ekspor Excel (`.xlsx`) dan PDF** dari filter yang sama, mengandung nama laporan, lokasi/cabang, jenis produk, periode, waktu ekspor, kolom yang dapat dibaca.
- Ekspor setidaknya bisa diuji dengan parsing/reading file: nilai total, jumlah record dan filter sama dengan tampilan. Tentukan bagaimana menangani data yang dipaginasi (seluruh hasil filter vs halaman aktif), tuliskan jelas dan konsisten.
- Jangan hardcode contoh pendapatan sebagai nilai operasional sesungguhnya.

---

## G. DATA MODEL & KONSISTENSI LINTAS ROLE

**Prinsip utama: extend schema existing, jangan menciptakan sumber data kedua untuk Owner.** Periksa kontrak data Tahap 03 terlebih dahulu.

Kandidat entitas/relasi (nama aktual boleh berbeda):

- `branches`/`locations` dengan `location_type = CENTRAL|BRANCH` bila repo membedakannya.
- `users` dengan role dan `branch_id` untuk Kasir/Admin; Owner global scope.
- `products`, `branch_stocks`, `central_stocks`, `stock_minimums` (tergantung schema).
- `stock_requests` + items: `request_id, origin_branch_id, product_id, requested_qty, status, created_at`.
- `distribution_allocations` + items: `allocation_id, source_location_id, destination_branch_id, product_id, allocation_qty, owner_id, request_id?, status, timestamps`.
- `goods_receipts`: `receipt_id, allocation_id?, branch_id, product_id, received_qty, idempotency_key, timestamps`.
- `stock_movements`/ledger dengan unique event/reference untuk rekonsiliasi.
- `purchase_orders`, `purchase_order_items`, `customers`, `prescriptions` (Owner hanya dapat data minimum untuk monitoring).
- `sales`, `sale_items`, `payments`: snapshot harga/nilai historis, payment lifecycle, unique gateway reference.
- `audit_logs`: actor, role, action, entity, branch, timestamp; redaksi sensitif.

### Aturan integritas wajib

1. Data filtered per cabang di backend bila backend ada; Owner global read, Admin A tidak boleh melihat alokasi B.
2. ID unik, referential integrity, validation integer qty, monetary decimal/integer IDR; hindari float untuk uang.
3. Distribusi, penerimaan, dan perubahan saldo ditangani atomik ketika aturan waktu perubahan stok telah ditetapkan. Rollback pada failure, audit event dan idempotency key untuk retry.
4. Menerima 5 barang fisik **bukan** operasi yang sama dengan Owner mengalokasikan 5 barang. Jangan secara otomatis menggandakan mutasi stok.
5. `source_stock - qty` harus mengikuti kebijakan gudang pusat yang disetujui; jika status barang dalam perjalanan belum didefinisikan, perlakukan sebagai issue terbuka dan jangan membuat angka saldo menyesatkan.
6. Penjualan Kasir mengurangi stok cabang hanya sesuai peristiwa pembayaran/transaksi sukses yang disahkan satu kali.
7. Periode laporan gunakan boundary waktu konsisten (UTC storage + tampilan WIB bila implementasi membutuhkannya); buat inclusive calendar dates dan uji perbatasan hari/bulan/tahun.
8. Jangan mengubah histori transaksional atau mengganti relasi PO/resep hanya karena master produk/resep diedit.
9. **Jika repo masih localStorage-only:** boleh membuat simulasi eksplisit untuk Owner dan transparan soal keterbatasannya, tetapi jangan klaim 3 role real-time lintas perangkat sudah terhubung tanpa backend otoritatif.

### Kebijakan bisnis yang belum final — TIDAK BOLEH DIANGGAP SUDAH DISETUJUI
- Pembuatan/edit cabang dan manajemen akun/hak akses oleh Owner.
- Status persetujuan/penolakan dan komentar untuk pengajuan stok.
- Waktu pengurangan stok pusat dan pencatatan stok in-transit.
- Siapa menetapkan PO `Selesai`; pertahankan aturan Tahap 03 yang sudah disetujui pengguna.
- Deposit, refund, fee gateway, settlement, koreksi, barang rusak/hilang.
- KPI laba/margin, HPP/COGS, profit per cabang; tidak tersedia pada data sumber.

Buat `docs/stage-04/OPEN_DECISIONS.md` dengan tiap isu, perilaku aman yang saat ini dipakai, risiko dan pertanyaan keputusan. Jangan mengerjakan fitur di luar scope hanya karena terlihat bagus.

---

## H. PEMBAGIAN IMPLEMENTASI (CHECKPOINT WAJIB)

### CHECKPOINT 0 — Audit, baseline & map modul
- Susun audit nyata PRD vs repo, route/module map, data contract, baseline test Kasir/Admin, dan Git hygiene.
- Jika dependency kritis Tahap 03 belum ada, dokumentasikan gap; lanjutkan hanya pekerjaan yang aman.

### CHECKPOINT 1 — UI Owner, autentikasi dan monitoring awal
- O01 Login Owner/shared login; O02 Dashboard; O03 Monitoring Cabang; O04 Monitoring Stok.
- Reuse design system lama, bukan redesign.
- Screenshot setiap halaman pada 1536×1024 dan mobile 390×844; evaluasi visual.
- Jalankan test Owner route, filters, no-edit dan cross-branch read.
- **Minta pengguna meninjau tampilan sebelum mengunci desain Owner dan mengerjakan halaman sisanya**, tanpa menganggap UI awal sebagai final.

### CHECKPOINT 2 — Pengajuan, alokasi, mutasi
- O05 Pengajuan Kebutuhan; O06 Alokasi Distribusi; O07 Mutasi & Distribusi.
- Hubungkan data Admin Cabang ke Owner dan balikannya hanya sesuai wewenang.
- Untuk mutasi pusat/in-transit butuh kebijakan yang sudah disetujui. Jika belum ada, selesaikan flow aman yang disupport sambil menandai blocker, jangan mengasumsikan aturannya.
- Buat integration tests untuk permintaan stok → owner alokasi → admin penerimaan → stock movements.

### CHECKPOINT 3 — Monitoring Transaksi, PO, dan laporan
- O08 Monitoring Transaksi/Pembayaran; O09 Monitoring PO; O10 Laporan/Export.
- Filter per cabang dan periode konsisten, tampilkan hanya data sukses sebagai penjualan selesai, serta ekspor PDF + XLSX yang dapat divalidasi.

### CHECKPOINT 4 — E2E 3 role, regression & delivery
- Jalankan test lintas Kasir, Admin Cabang, Owner untuk tiga cabang/dua cabang + pusat, user isolation dan stok.
- Screenshot semua halaman Owner desktop/mobile, dan regression snapshot Kasir/Admin.
- Buat laporan hasil serta gap teknis/keputusan bisnis yang belum final; jangan menyatakan PASS untuk tes yang tidak dieksekusi.

---

## I. PENGUJIAN WAJIB — MINIMUM MATRIX

Buat `qa/stage-04/THREE_ROLE_TEST_MATRIX.md` dari `stage-04/qa/REFERENCE_TEST_MATRIX.md` dan jalankan pengujian aktual sesuai tools yang tersedia.

**Auth dan lintas cabang**
- T04-01 Owner login → dashboard Owner.
- T04-02 Kasir/admin tidak dapat membuka route/API Owner.
- T04-03 Owner memilih cabang A lalu semua → statistik detail sesuai filter.
- T04-04 Admin A tidak boleh membuka request/alokasi/data private cabang B.
- T04-05 Logout/expired session → akses Owner ditolak.

**Pengajuan dan distribusi**
- T04-06 Admin A membuat permintaan stok → Owner dapat melihat; stok A tidak berubah.
- T04-07 Owner membuat alokasi ke A → Admin A melihat, Admin B tidak.
- T04-08 Owner mengalokasikan melebihi saldo yang dapat dialokasikan → validasi menolak (berdasarkan kebijakan stok yang diadopsi).
- T04-09 Klik alokasi dua kali / retry identik → tepat satu alokasi.
- T04-10 Admin A menerima barang aktual → stok A bertambah sekali dan Owner melihat ledger.
- T04-11 Retry penerimaan identik → stok tidak bertambah lagi.
- T04-12 Stok pusat/in-transit sesuai kebijakan yang ditulis/disetujui; jika kebijakan belum ada → BLOCKED, jangan PASS palsu.

**Penjualan & PO**
- T04-13 Kasir B transaksi sukses → total penjualan B naik sekali, total semua cabang naik sekali, cabang A tidak.
- T04-14 Transaksi pending/failed → tidak dihitung penjualan selesai.
- T04-15 Callback/retry sukses yang sama → tidak menggandakan angka laporan/stok.
- T04-16 Kasir A buat PO → Admin A proses → Owner dapat memantau status, tidak bisa mengubahnya.
- T04-17 Filter `Sudah Datang` hanya menampilkan PO valid dari filter cabang.
- T04-18 Owner mencoba edit pembayaran Kasir/PO/data resep → ditolak.

**Laporan & ekspor**
- T04-19 Filter satu cabang vs semua → jumlah baris dan total agregat rekonsiliasi.
- T04-20 Rentang tanggal inklusif dengan transaksi tepat batas awal/akhir.
- T04-21 XLSX menampilkan data/totals yang sama dengan filter yang ditampilkan.
- T04-22 PDF menampilkan data/totals yang sama dengan filter yang ditampilkan.
- T04-23 Ekspor data kosong → file valid dan informasi tidak ada data jelas.
- T04-24 Banyak data → pagination/performance layak dan ekspor tidak kehilangan baris.

**Regresi UI dan fungsi**
- T04-25 Login/Checkout Kasir, buat PO dan detail transaksi lama tidak rusak.
- T04-26 Admin Produk, Stok, Penerimaan, dan PO tidak rusak.
- T04-27 Owner desktop 1536×1024 / mobile 390×844 tanpa overflow horizontal.
- T04-28 Kasir/Admin visual screenshot tetap sesuai baseline; jika beda jelaskan dengan diff.

Sertakan pengujian konkurensi distribusi dan source stock ketika backend nyata, termasuk race condition dan rollback. Bila belum memiliki backend nyata, mark `DEMO_ONLY` untuk keamanan server, konkurensi multi-user dan update lintas perangkat.

---

## J. BERKAS HASIL DAN CARA PEMBUKTIAN

Tambahkan dalam repo:

```
docs/stage-04/
  BASELINE_AUDIT.md
  ROUTES_AND_PERMISSIONS.md
  DATA_CONTRACT.md
  OPEN_DECISIONS.md
  IMPLEMENTATION_LOG.md
  UI_REVIEW.md
qa/stage-04/
  THREE_ROLE_TEST_MATRIX.md
  TEST_RESULTS.md
  REGRESSION_REPORT.md
  screenshots/
    owner-dashboard-desktop.png
    owner-dashboard-mobile.png
    owner-branches-desktop.png
    owner-stock-desktop.png
    owner-requests-desktop.png
    owner-allocation-desktop.png
    owner-movements-desktop.png
    owner-transactions-desktop.png
    owner-po-desktop.png
    owner-reports-desktop.png
    cashier-regression.png
    admin-regression.png
```

Jangan mengarang screenshot/test result. Buat dari website yang benar-benar dijalankan. Pada hasil akhir berikan:

1. File yang diubah + penjelasan singkat.
2. Tech stack dan arsitektur real yang dideteksi.
3. Status tiap modul O01–O10 (`DONE`, `PARTIAL`, `BLOCKED`).
4. Screenshot aktual + alasan deviasi visual.
5. Hasil test `PASS`, `FAIL`, `BLOCKED`, `DEMO_ONLY`, atau `NOT_RUN` beserta buktinya.
6. Rekap seluruh issue bisnis yang butuh keputusan sebelum production.
7. Cara menjalankan, env variable yang dibutuhkan, migration/seed **aman**, dan langkah pemulihan.
8. Tidak mengklaim production-ready tanpa security/backend UAT dan persetujuan klien.

**Selesai bila:** Owner dapat membaca data 3 role sesuai scope, melakukan keputusan alokasi dengan aturan inventori yang terdokumentasi, menerima hasil pengajuan/PO/penjualan terbaru tanpa duplikasi, menghasilkan ekspor yang benar, dan regresi Kasir/Admin tetap lolos. Bila kebijakan inventori belum ditetapkan, hasil harus dinyatakan PARTIAL dengan blocker yang jelas.

**MULAI SEKARANG:** Audit repo, bangun checkpoint 0–1 terlebih dahulu, tampilkan hasil dan screenshot untuk review desain, baru lanjut checkpoint 2–4 setelah approval. Jangan berhenti pada rencana teoretis.
