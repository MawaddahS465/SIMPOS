# MASTER PROMPT OPENCODE — SIMPOS OPTIK MEKAR JAYA | ADMIN CABANG

PERAN ANDA
Bertindak sebagai Senior Frontend Engineer, Design-System Engineer, Product Engineer, dan Visual QA Engineer. Anda bekerja pada proyek SIMPOS Optik Mekar Jaya. Buat AREA ADMIN CABANG YANG RESPONSIF, INTERAKTIF, DAN SANGAT KONSISTEN secara visual dengan desain Kasir lavender yang sudah disetujui. Jangan menyusun ulang desain berdasarkan preferensi atau menyalin dashboard template generik.

HASIL YANG DIMINTA
1) Satu aplikasi terpadu dengan tiga role sesuai lingkup proyek, tetapi tugas ini HANYA mengerjakan ADMIN CABANG.
2) Jaga area Kasir yang sudah ada; tidak boleh merombak UI Kasir, menghapus halaman, mengubah rute, atau merusak logic-nya.
3) Gunakan UI tokens/layout principles dari screenshot Kasir terlampir. Dashboard Admin bukan salinan isi dashboard Kasir.
4) Implementasi dapat diuji dan ditelusuri, screenshots aktual, laporan visual QA, serta daftar keputusan terbuka.

MULAI DENGAN AUDIT WAJIB
- Baca seluruh `admin-brief/docs/PRD_SIMPOS_Optik_Mekar_Jaya_Admin_Cabang.pdf`.
- Periksa semua file `admin-brief/references/shared-design/` dan gunakan sebagai referensi warna, typografi, layout shell, cards, sidebar, tombol, form, tabel, shadows, translucency.
- Cari kode existing seperti `src`, routes, komponen Kasir, theme tokens, auth, demo data, dan storage. Jika repository masih kosong, bangun kerangka modular yang kompatibel untuk multi-role.
- PERIKSA `admin-brief/references/admin-approved/`: saat awal kosong. Artinya BELUM ADA screenshot Admin yang boleh disebut referensi pixel-perfect. Buat konsep awal Admin dari design system Kasir dan PRD, lalu **minta persetujuan user atas screenshot empat halaman inti** sebelum mengklaim visual Admin final.
- Pelajari dan ikuti `admin-brief/docs/ADMIN_PAGE_MAP.md` dan `admin-brief/docs/VISUAL_QA.md`.
- Tampilkan temuan awal: stack existing, pola desain Kasir yang diukur dari gambar, daftar modul Admin, dan pertanyaan kritis yang benar-benar blocking. Jangan membuat asumsi bisnis diam-diam.

HIERARKI SUMBER
- PRD Admin = otoritas requirement, aktor, rules, integrasi.
- Screenshot Kasir FINAL = otoritas desain SHARED (warna, konsistensi brand, radius, spacing, nav, surface, ikon, typography); TIDAK mengatur konten/Admin flows.
- Screenshot Admin yang kelak disetujui = otoritas visual untuk halaman Admin tertentu.
- Source lama = implementasi yang dapat direuse hanya jika tidak melanggar dua aturan di atas.
- Jika ada konflik PRD dengan screenshot (misalnya fitur Produk editable oleh Kasir pada referensi yang salah), ikuti PRD untuk izin dan screenshot hanya untuk VISUAL.

DESIGN SYSTEM TERKUNCI
Nama gaya: Premium Optical Workspace, soft-lavender glass-lite, airy, clean, non-cluttered.
- Main background: gradien lavender-putih sangat lembut, bukan gelap/oranye/neon.
- Sidebar: panel terang putih/translucent dengan rounded corners, subtle border, active nav lavender/indigo.
- Topbar: search / notifications / akun & cabang, lebar nyaman, padding tidak sesak.
- Surfaces: soft white, radius konsisten, outline halus, shadow tipis (jangan semua diberi shadow berlebihan).
- Primary actions: violet/indigo; secondary ghost/outline; semantic status hijau/amber/merah hanya untuk kondisi nyata.
- Main text navy gelap; supporting text muted violet-gray; line icons Lucide/SVG, tidak pakai emoji.
- Typography: Inter/Plus Jakarta Sans atau fallback modern yang sangat dekat.
- Layout: desktop-first, whitespace lega, satu tugas utama per halaman. Jangan menambah KPI, charts atau hero panjang untuk sekadar mengisi area kosong.
- Sample warna dari gambar. Nilai hex yang ditebak BUKAN pengganti sampling dan verifikasi screenshot.
- Foto kacamata BISA dipakai pada header kecil yang sesuai; jangan memaksakan hero e-commerce besar pada semua layar operasional.
- Semua elemen klikable berupa komponen nyata. DILARANG menjadikan screenshot penuh sebagai background/overlay palsu.

SIDEBAR ADMIN — KHUSUS ROLE INI
Atur sidebar lengkap namun tidak padat, dikelompokkan dengan divider:
  Utama: Dashboard
  Master Produk: Frame, Lensa
  Persediaan: Stok Cabang, Penerimaan Barang, Distribusi Masuk, Pengajuan Stok, Riwayat Mutasi
  Operasional: Pemesanan (PO)
  Footer: nama cabang dan `Admin Cabang`.
Gabungkan menu `Frame` dan `Lensa` di bawah `Produk` (tab/rute child) jika itu lebih sesuai visual referensi; jangan duplikasi navigasi atas.
Jangan tampilkan: Transaksi Baru, Checkout, Pelunasan, Cetak Nota Kasir, Pengelolaan Resep Pelanggan, Pembelian Supplier, Laporan Konsolidasi Pemilik, Otorisasi Pemilik.
Pada mobile sidebar menjadi drawer. Pada 768px gunakan sidebar ringkas atau drawer, sesuai proporsi.

ROUTES / PAGE SCOPE (ROUTE PREFIX /admin; sesuaikan router yang sudah ada)
- `/admin/login` ATAU shared `/login` + redirect berdasarkan role sesudah autentikasi; jangan buat dua login conflicting.
- `/admin/dashboard` = ringkasan kebutuhan harian khusus cabang.
- `/admin/produk/frame` = list/master frame, pencarian, filter, tambah, edit, non-destructive delete sesuai keputusan bisnis.
- `/admin/produk/lensa` = list/master lensa terpisah, kategori, harga dan pencarian.
- `/admin/stok` = stok cabang, batas minimum, status menipis, detail mutasi; bukan edit saldo manual.
- `/admin/penerimaan` = daftar barang diterima/menunggu, input jumlah diterima aktual, konfirmasi, mutasi dan update stok.
- `/admin/distribusi` = daftar distribusi dari pusat untuk cabang ini, jumlah alokasi READ-ONLY, status kiriman dan detail penerimaan.
- `/admin/pengajuan` = daftar pengajuan kebutuhan, form baru, riwayat status (gunakan status hanya sebagai demo bila belum disepakati).
- `/admin/pemesanan` = antrean PO baru Dipesan dari Kasir cabang, search/filter; detail.
- `/admin/pemesanan/:id` = detail frame/lensa, ukuran lensa snapshot, timeline, aksi Dipesan->Diproses->Sudah Datang sesuai prosedur.
- `/admin/mutasi` = riwayat pergerakan masuk/keluar, filter produk/periode/referensi.

DESAIN 4 ANCHOR SCREENS — TAHAP 01, WAJIB REVIEW USER
A. Login Admin: visual 1 keluarga dengan Login Kasir final. Gunakan logo/panel, ukuran dan warna yang identik. Teks `Masuk sebagai Admin Cabang` dan cabang yang ditugaskan. Tidak ada pilihan admin untuk mengakses cabang lain. Jika login shared sudah ada, pertahankan desainnya dan bedakan tujuan redirect oleh role.
B. Dashboard Admin: **minimalis**, bukan dashboard laporan Pemilik. Beri judul `Dashboard Admin Cabang`, identifier cabang. Area ringkas 3 indikator prioritas: `Stok Menipis`, `PO Baru`, `Barang Menunggu Penerimaan`; satu panel `Perlu Ditindaklanjuti` maksimal 5 baris dengan status dan aksi; satu baris tombol relevan (`Tambah Produk`, `Catat Penerimaan`, `Ajukan Stok`). Jika perlu space, gunakan whitespace, jangan tambahan grafik. Tidak ada ringkasan revenue/penjualan lintas cabang.
C. Manajemen Produk: tabel/list produk legible, kategori `Frame` / `Lensa` terpisah, search, filter kategori, harga, status, tombol `Tambah Produk`; form tambah/edit dalam drawer atau halaman sesuai konsistensi design. Foto frame boleh menjadi thumbnail kecil. Jangan gunakan grid kartu e-commerce sebagai satu-satunya mode jika menghambat pengelolaan data.
D. Stok Cabang: tabel jelas berisi Kode/Nama Produk, Jenis, Stok Saat Ini, Batas Minimum, Status, dan akses mutasi. Label Stok Menipis ketika `saldo <= batas_minimum`. Aksi `Atur Minimum` dan `Ajukan Stok`, bukan `+ tambah saldo` tanpa pencatatan penerimaan.

PAUSE/GATE SETELAH TAHAP 01
- Jalankan keempat layar, ambil screenshots 1536x1024 dan 390x844; perlihatkan kepada user dan tulis file `qa/admin-visual-stage-01.md`.
- Jelaskan mana yang sudah match sistem Kasir (design tokens/layout) dan mana keputusan baru Admin.
- **Jangan klaim pixel-perfect gambar Admin** sebelum disetujui sebagai baseline. Jika user bisa berinteraksi selama run ini, minta persetujuan sebelum tahap berikutnya. Jika user menginstruksikan pengerjaan otomatis tanpa jeda, boleh lanjut secara provisional, labelkan hasil visual sebagai belum final.

TAHAP 02 — ALUR ADMIN LANJUTAN
1. Barang masuk / penerimaan:
   - Cari distribusi yang ditujukan ke cabang admin.
   - Tampilkan `qty_alokasi` ditetapkan Pemilik sebagai READ-ONLY dan `qty_diterima_aktual` yang diinput Admin.
   - Validasi >0, cek duplikasi referensi/idempotensi, catat mutasi masuk dan tambah stok cabang SATU KALI setelah konfirmasi sukses.
   - Penanganan selisih kuantitas ditandai `perlu keputusan bisnis`, jangan otomatis mengubah jatah Pemilik.
2. Distribusi masuk:
   - Memantau asal/pusat, tujuan cabang, item, jumlah alokasi, jumlah diterima, tanggal/status.
   - Admin tidak bisa membuat atau mengedit keputusan distribusi milik Pemilik.
   - Tentukan kapan stok pusat dikurangi hanya setelah kebijakan dikonfirmasi; untuk prototype tampilkan asumsi terlabel.
3. Pengajuan Stok:
   - Pilih produk dari cabangnya, kuantitas >0, keterangan opsional (usulan field dari PRD), buat pengajuan dan beri notifikasi mock pada Pemilik.
   - Status approval/reject tidak boleh diasumsikan final; tandai kebijakan belum disetujui.
4. Pemesanan PO:
   - PO dibuat Kasir dan tampil sesuai cabang; periksa frame/lensa serta snapshot resep, bukan memodifikasi resep aslinya.
   - Admin bisa Dipesan->Diproses dan Diproses->Sudah Datang. Kasir melihat status yang sama dari shared store/backend.
   - Hak siapa yang menandai `Selesai` belum diputuskan. Jangan beri aksi Selesai kepada Admin secara otomatis; buat flag/pending decision yang jelas.
5. Riwayat Mutasi:
   - Mutasi masuk dari penerimaan, mutasi keluar dari penjualan BERHASIL pada role Kasir, serta referensi/cabang/waktu/aktor.
   - Admin hanya melihat mutasi cabangnya, tidak mengedit histori arbitrer.

ATURAN BISNIS WAJIB (cocok PRD)
- Ada 3 role sistem: Kasir, Admin Cabang, Pemilik. Hanya fitur Admin Cabang dibuat di task ini.
- Frame dan lensa produk berbeda. Pengelolaan produk CRUD hanya pada scope yang diotorisasi. Master global vs tiap cabang BELUM DIPUTUSKAN: jangan berasumsi permanen.
- Admin Cabang hanya dapat mengakses cabangnya. Filter semua query dan mutation berdasarkan role + branch_id pada SERVER ketika backend tersedia; penyembunyian menu saja bukan RBAC yang aman.
- Stok dipisahkan per produk/lokasi. Label `Stok Menipis` saat saldo `<=` minimum. Tidak boleh stok negatif.
- Penjualan sukses via Kasir mengurangi stok secara otomatis SATU KALI. Admin melihat efeknya tetapi tidak memproses pembayaran.
- Penerimaan yang valid menambah stok SATU KALI; daftar tidak bergantung pada reload browser.
- Pemilik menentukan alokasi, Admin hanya menerima/catat barang aktual. Supplier ordering di luar aplikasi.
- Snapshot resep pada PO tidak berubah saat resep asli pelanggan direvisi.
- Login email/password, hak akses cabang, UI responsive, search/filter/pagination, backup/restore di backend plan. Untuk local demo: jangan klaim keamanan server atau payment gateway nyata.

DATA, STACK, & INTEGRASI
- Reuse komponen reusable Kasir: AppShell, Sidebar, Header, PageTitle, Card, Button, Input, Select, Dialog/Drawer, Table, Badge, Confirm, Toast, Loading, EmptyState.
- Gunakan source data yang sama untuk demo agar perubahan PO Admin terlihat di halaman Kasir dan transaksi sukses Kasir mempengaruhi stok Admin. Bila frontend saja, gunakan state/store terpusat dan persistence lokal DEMO; jangan bikin data cabang dan PO yang tidak sinkron antar role.
- Jangan overwrite akun Kasir yang sudah bekerja. Buat akun Admin demo terpisah, password demo jelas dan bukan authentication production.
- Dokumen asli punya konflik stack: Charter HTML/CSS/JavaScript/Bootstrap/CodeIgniter4/MySQL dan Bab II React/Supabase. Audit repo; ikuti stack yang sudah disetujui/ada. Jangan migrasi backend tanpa persetujuan.
- Inisialisasi fixture yang masuk akal; nominal dan jumlah harus dihitung, tidak hardcoded untuk transaksi interaktif.
- Semua changes to stok/PO/penerimaan wajib audit trail minimal ID, tanggal, user/role, cabang, reason/reference.

VISUAL QA + FUNGSI QA
- Screenshot desktop 1536x1024 untuk Login, Dashboard, Produk Frame, Produk Lensa, Stok, Penerimaan, Pengajuan, Daftar PO, Detail PO, Mutasi. Mobile 390x844 untuk keempat anchor + 375x812 key forms.
- Ukur shell: margin sidebar, width, topbar, nav font/icon, spacing, radius, opacity, hero scale, button/input heights. Bandingkan dengan refs shared-design untuk unsur shared; bukan memaksa semua halaman sama screenshot Kasir.
- Gunakan Playwright jika tersedia: run dev server, screenshot, visual diffs/overlay; iterasi sampai matching konsisten. Jalankan lint/typecheck/build serta UAT admin.
- Tidak boleh ada horizontal overflow global pada mobile. Tabel boleh memiliki horizontal scroll TERLOKALISIR dengan label jelas.
- Test: admin A tidak dapat data cabang B (mock jika frontend demo; pengujian server wajib saat backend tersedia); CRUD frame+lensa; harga negatif ditolak; saldo==minimum menunjukkan stok menipis; pengajuan muncul ke Pemilik; alokasi read-only; penerimaan qty 5 menambah stok 5 sekali; penolakan duplikat; PO Dipesan->Diproses->Sudah Datang; penjualan Kasir mengurangi stok sekali.
- Semua tombol harus bermakna; jika endpoint/backend belum tersedia, beri label `Demo` atau nonaktif dengan penjelasan. Jangan fake success untuk data yang tidak disimpan.

DELIVERABLES
- `admin-brief/qa/` atau `qa/admin/`: actual screenshots, desktop & mobile.
- `qa/admin/VISUAL_AUDIT.md`: baseline, actual, screenshots/diff, gaps, status per page.
- `qa/admin/UAT.md`: langkah uji, expected, actual, pass/fail; tandai uji RBAC server tidak dilakukan jika masih prototype.
- `docs/ADMIN_IMPLEMENTATION.md`: route map, component usage, data contract, choices/open decisions.
- Source code implementasi, perintah install/dev/build dan bukti build sukses.
- Jelaskan apa yang belum sesuai secara eksplisit.

CRITICAL STOP RULES
Jangan membuat ulang desain UI Kasir. Jangan campurkan halaman Admin ke sidebar Kasir. Jangan buat transaksi pembayaran Admin. Jangan beri akses Admin ke cabang lain atau keputusan alokasi Pemilik. Jangan mengedit saldo langsung tanpa event penerimaan. Jangan mengklaim ADMIN pixel-perfect tanpa screenshot Admin yang disetujui. Jangan menghentikan pekerjaan hanya karena komponen tampil: screenshot QA + functional testing wajib.

PERINTAH EKSEKUSI
Mulai dengan membaca PRD, folder referensi, lalu audit repo. Implementasikan TAHAP 01: login/role redirect, Dashboard Admin yang MINIMAL, Produk, Stok. Ambil screenshot 1536x1024 dan 390x844, laporkan hasil, tunjukkan visual yang perlu disetujui, tanpa menyentuh halaman Kasir yang sudah fix. Setelah persetujuan visual, lanjutkan tahap 02 sesuai prioritas PRD.
