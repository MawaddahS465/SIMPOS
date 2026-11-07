# MASTER EXECUTION PROMPT — ADMIN CABANG | TAHAP 02
## SIMPOS Optik Mekar Jaya • Penerimaan, Distribusi Masuk, Pengajuan, PO, Mutasi

**Peran Anda:** Senior Product Engineer + Senior Frontend Engineer + UI Engineer + QA Engineer. Tugas ini adalah MELANJUTKAN area **Admin Cabang** yang sudah dibangun pada Tahap 01, bukan membuat proyek baru atau merombak desain. Kerjakan source code langsung; jangan berhenti pada rencana atau mockup.

## A. KONTEKS DAN OTORITAS

1. Baca `admin-brief/MASTER_PROMPT_ADMIN_OPENCODE.md`, `admin-brief/docs/PRD_SIMPOS_Optik_Mekar_Jaya_Admin_Cabang.pdf`, `admin-brief/docs/ADMIN_PAGE_MAP.md`, dan `admin-brief/docs/VISUAL_QA.md`.
2. Audit repository: routing, authentication/role, cabang aktif, produk frame/lensa, saldo stok, penjualan Kasir, PO Kasir, database/store, komponen, CSS tokens, tests, screenshots Tahap 01. Temukan dan patuhi pola yang sudah dipakai. Jika struktur folder berbeda, cari berdasarkan nama/isi; jangan membuat duplikat `src`/router/store.
3. Sumber kebenaran fungsi: PRD dan proses bisnis SIMPOS. Sumber kebenaran gaya visual: Tahap 01 Admin yang **sudah disetujui pengguna**, bila tersedia, dan gambar Kasir pada `admin-brief/references/shared-design/` untuk *shared design system*. Jika belum ada konfirmasi Tahap 01, kerjakan Tahap 02 secara **provisional**, tandai visual sebagai belum disetujui dan jangan mengklaim pixel-perfect.
4. **Larangan keras:** jangan redesign; jangan mengubah menu/tampilan/logic Kasir yang sudah benar; jangan membuat area Pemilik atau fitur supplier; jangan menambahkan fitur pembayaran untuk Admin.
5. Sebelum coding, keluarkan ringkasan maksimal 15 baris: stack yang ada, lokasi modul, jalur data lintas role, dan apa saja dari Tahap 01 yang perlu dipertahankan. Setelah itu LANGSUNG implementasikan, tanpa menunggu respons untuk hal yang tidak menghambat.

## B. SCOPE TAHAP 02 — LIMA HALAMAN UTAMA

Gunakan prefix route `/admin` bila itu sesuai router yang ada. Sidebar Admin yang sudah jadi jangan dipindah-pindah.

### B1. Penerimaan Barang — `/admin/penerimaan`
**Tujuan:** Admin mencatat barang yang benar-benar diterima cabangnya, bukan menambah stok secara manual.

**UI:** judul + deskripsi singkat; pencarian kode distribusi/produk; filter status/periode; daftar penerimaan menunggu dan sudah dikonfirmasi; detail terpilih dalam drawer/modal/halaman yang konsisten dengan komponen Tahap 01. Tampilkan referensi distribusi, tanggal, sumber `Pusat`, tujuan cabang, produk, kode, jenis Frame/Lensa, kuantitas alokasi (READ-ONLY), input kuantitas diterima aktual, status, dan tombol `Konfirmasi Penerimaan`. Tampilkan ketidaksesuaian kuantitas sebagai `Selisih / Perlu Ditinjau`, bukan otomatis mengganti alokasi.

**Aturan:**
- Hanya distribusi yang ditujukan ke cabang akun Admin yang boleh muncul.
- Kuantitas aktual harus bilangan bulat > 0. Jika kebijakan penerimaan parsial, over-delivery atau selisih belum diputuskan, *jangan mengarang approval otomatis*: tampilkan keputusan yang belum final secara jelas dan batasi jalur berisiko.
- Setelah konfirmasi sah, buat satu bukti penerimaan dengan ID unik dan satu mutasi `IN` di cabang; tambah saldo persis satu kali. Terapkan idempotency/unique event reference agar refresh/double-click/retry tidak menggandakan stok.
- Sebelum menyimpan, tampilkan ringkasan `stok sebelum`, `qty diterima`, `stok sesudah`, dan konfirmasi.
- Transaksi database atomik bila backend ada; jika masih prototype frontend, buat demo persistence yang konsisten dan catat keterbatasannya.
- Penerimaan tidak otomatis mengubah status PO menjadi Sudah Datang tanpa kaitan PO yang jelas.

### B2. Distribusi Masuk — `/admin/distribusi`
**Tujuan:** Admin memantau alokasi pusat → cabang dan menindaklanjuti penerimaannya.

**UI:** tabel daftar distribusi yang memuat ID, tanggal, lokasi asal, cabang tujuan, jumlah item, qty dialokasikan, qty diterima, dan status. Detail berisi produk per baris dan tautan `Catat Penerimaan` ke B1. Cari/filter berdasarkan nomor, tanggal, status, produk. Tampilkan status sederhana (misalnya `Menunggu Diterima`, `Diterima`), tetapi jangan menyatakan workflow status sebagai kebijakan resmi bila belum divalidasi.

**Hak akses:** keputusan alokasi dan distribusi dibuat Pemilik; semua field alokasi READ-ONLY di Admin. Admin tidak boleh membuat distribusi pusat baru, mengubah `qty_alokasi`, mengalihkan cabang penerima, atau melihat distribusi cabang lain.

**Integrasi:** jumlah distribusi, penerimaan, dan histori harus memakai *satu data source*; bukan tabel dummy yang tidak berubah. Waktu pengurangan stok pusat / barang dalam perjalanan masih keputusan terbuka PRD: jangan membuat logika permanen tanpa keputusan dan catat di dokumen keputusan.

### B3. Pengajuan Kebutuhan Stok — `/admin/pengajuan`
**Tujuan:** Menyampaikan kebutuhan penambahan barang kepada Pemilik; bukan langsung menambah stok.

**UI:** daftar pengajuan cabang + tombol `Ajukan Stok`, pencarian/filter; form pilih produk tersedia pada cabang (frame/lensa), tampilkan stok saat ini, minimum, indikator stok menipis, qty usulan bilangan bulat > 0, dan keterangan opsional. Ada preview ringkasan sebelum kirim; setelah berhasil pengajuan tampak di riwayat dengan ID, timestamp, user, cabang, produk, qty, dan status; beri feedback tersimpan.

**Aturan:** indikator `Stok Menipis` hanya jika `stock <= minimum_stock`. Pengajuan tidak menaikkan stok. Notifikasi ke Pemilik harus terhubung ke store/back-end yang sama atau, bila belum ada area Pemilik, simpan entitas/queue notifikasi demo yang nantinya dapat dibaca role Pemilik; label `Simulasi` dengan jelas. Status persetujuan/penolakan belum final menurut PRD; jangan membangun tindakan Pemilik di layar Admin.

### B4. Pemrosesan Pemesanan (PO) — `/admin/pemesanan` dan `/admin/pemesanan/:id`
**Tujuan:** PO yang dibuat Kasir di cabang yang sama dapat diproses Admin.

**Daftar:** search nomor PO/nama pelanggan, filter status `Dipesan`, `Diproses`, `Sudah Datang`, `Selesai`, badge jelas, tanggal, jenis produk, ringkasan, dan aksi `Lihat Detail`. Utamakan PO baru yang perlu diproses; jangan membuat katalog frame besar atau layout Checkout.

**Detail:** nomor PO, status, pelanggan (read-only dalam konteks Admin), produk/frame/lensa dan qty, snapshot ukuran resep OD/OS saat PO dibuat (read-only; jangan mengubah riwayat resep), timeline beserta aktor/waktu, catatan proses opsional, aksi status yang diizinkan.

**Transisi terotorisasi:** `Dipesan → Diproses` dan `Diproses → Sudah Datang` dilakukan Admin ketika syarat terpenuhi. Validasi transisi di layer data/server jika ada; jangan hanya mengandalkan tombol tersembunyi. Saat status berubah, simpan audit event dan pastikan halaman PO Kasir membaca status baru dari sumber yang sama. Tidak boleh Admin mengubah status kembali tanpa workflow koreksi yang ditetapkan. **Transisi ke `Selesai` belum diputuskan** dalam PRD; jangan aktifkan tombol Selesai Admin secara diam-diam, dokumentasikan sebagai keputusan terbuka.

### B5. Riwayat Mutasi Stok — `/admin/mutasi`
**Tujuan:** Menunjukkan jejak seluruh perubahan stok per cabang secara auditabel, bukan form edit saldo.

**UI:** tabel mutasi berisi waktu, ID/ref event, kode & produk, jenis `Masuk/Keluar`, sumber `Penerimaan/Penjualan/Distribusi`, qty bertanda +/-, saldo sebelum, saldo sesudah, aktor, cabang. Search ID/produk, filter jenis/periode/sumber, pagination, detail event. Pakai badge semantik yang tenang; pertahankan white-space dan proporsi tabel yang terbaca.

**Aturan:** Mutasi dari B1 tampil otomatis; transaksi Kasir yang sukses menyebabkan mutasi keluar **sekali saja** pada cabang yang sesuai; cancel/gagal/pending tidak mengurangi stok. Admin hanya boleh **melihat** riwayat mutasi, bukan menghapus atau mengubahnya. Untuk mobile gunakan scroll tabel lokal atau kartu ringkas, tanpa global horizontal overflow.

## C. KONTRAK DATA DAN INTEGRASI

1. Reuse tipe/entitas Tahap 01. Jika butuh tambahan field, buat migration/interface yang kompatibel: `branch_id`, `product_id`, `distribution_id`, `receipt_id`, `request_id`, `po_id`, `stock_movement_id`, `created_at`, `created_by`, `quantity`, `status`, `source_ref`, `idempotency_key`. Ini contoh kontrak, bukan mandat mengganti schema existing.
2. **Satu saldo stok per product+branch**. Setiap saldo berubah hanya lewat event valid, bukan edit angka langsung.
3. Katalog frame/lensa yang Admin kelola harus dapat dibaca Kasir pada cabang yang benar sesuai desain kepemilikan master produk yang berlaku. Jangan ubah histori harga transaksi sebelumnya ketika harga produk diperbarui.
4. Semua query dan tindakan Admin harus di-scope ke `branch_id` user. Untuk backend, terapkan otorisasi di server. Untuk prototype localStorage, gunakan guard demo + tulis jelas bahwa itu **bukan keamanan production**.
5. Hindari `JSON` dummy per halaman yang berdiri sendiri. Jika backend belum tersedia, pakai central store/repository serta local persistence DEMO yang sinkron di halaman dan role; reload tidak boleh membuat event ganda.
6. Jaga transaksi Kasir yang sudah berfungsi. Cek aksi checkout existing: jika stok sudah dikurangi oleh Kasir, jangan tambahkan pengurangan kedua ketika Admin melihatnya.
7. Pemesanan/beli ke supplier, penentuan alokasi pusat, transfer antarcabang bebas, pengeditan resep pelanggan dan pembayaran Kasir **di luar scope Admin Tahap 02**.

## D. SPESIFIKASI UI/UX RESPONSIF DAN VISUAL FIDELITY

- **Jangan ubah design system**: lavender pastel-putih, background gradient lembut, aksen violet/indigo, teks deep-navy, line icons, rounded card, shadow tipis, opacity konsisten dengan Admin Tahap 01 dan referensi Kasir.
- Navbar/sidebar harus persis komponen reusable Tahap 01; menu aktif cocok dengan halaman; footer cabang dan role Admin selalu jelas.
- Desain operasional **tabel-first**, bukan katalog belanja/checkout; satu tugas utama per halaman, hindari KPI berlebihan, ornamen dan popup beruntun.
- Top area berisi heading, 1 subheading, tindakan primer sesuai halaman, toolbar pencarian/filter; tombol primer hanya satu yang benar-benar utama per konteks.
- Detail dibuka lewat drawer/halaman konsisten; form dengan label di atas, validasi inline, tombol batal/simpan jelas, konfirmasi sebelum aksi yang mengubah stok/status.
- State wajib: empty, loading, error, success, validasi, disabled saat submit, dan toast yang tidak menutupi konten.
- Desktop target: 1536×1024 dan 1280×800; tablet: 768×1024; mobile: 390×844 serta 375×812. Pada mobile sidebar drawer; tabel boleh scroll *di dalam area tabel saja*; tidak ada overflow horizontal halaman.
- Screenshot asset bukan background seluruh halaman. Jangan mengeklaim pixel-perfect halaman Admin tanpa screenshot Admin yang disetujui; samakan desain bersama, lalu audit screenshot aktual.

## E. QA WAJIB — JANGAN LEWATI

**Sebelum implementasi**: pastikan Tahap 01 build & routes berjalan; simpan git checkpoint/branch baru bila repo Git tersedia tanpa melakukan destructive operation.

**Functional acceptance tests** (otomatis bila memungkinkan, manual checklist bila belum):
1. Admin A tidak bisa melihat/memutasi cabang B (server test jika ada backend).
2. Stok=minimum memunculkan `Stok Menipis`; stok > minimum tidak.
3. Buat pengajuan qty 5 tidak mengubah saldo stok; pengajuan tercatat dan bisa dilihat sumber data Pemilik/demi mock.
4. Alokasi `qty_alokasi` tidak editable oleh Admin.
5. Penerimaan qty 5 menambah stok cabang tepat 5 dan membuat 1 mutasi; double-click/refresh/retry tidak membuat event kedua.
6. Penerimaan qty 0, negatif, kosong, noninteger ditolak; selisih kuantitas tidak diam-diam mengubah keputusan Pemilik.
7. PO Kasir cabang A muncul pada Admin A, tidak pada Admin B.
8. PO `Dipesan → Diproses → Sudah Datang` tersimpan lintas reload dan terlihat Kasir; transisi melompati tahapan ditolak.
9. Snapshot resep PO tidak berubah jika arsip resep pelanggan diperbarui.
10. Penjualan Kasir sukses qty 2 mengurangi stok 2 tepat sekali dan menghasilkan mutasi `OUT`; pending/gagal tidak.
11. Setelah mengirim form, refresh menunjukkan data baru; tidak ada tombol tanpa fungsi atau toast sukses palsu.
12. Tidak ada regression pada Login, Dashboard, Produk, Stok Kasir/Admin, Transaksi Baru, Checkout, dan PO Kasir.

**Visual QA**: ambil screenshot aktual `/admin/penerimaan`, `/admin/distribusi`, `/admin/pengajuan`, `/admin/pemesanan`, `/admin/pemesanan/:id`, `/admin/mutasi` pada 1536×1024 dan minimal dua layar representatif pada 390×844; bandingkan dengan desain Tahap 01/shared components untuk sidebar, typography, radius, spacing, controls, badges. Perbaiki mismatch, bukan cukup mengklaim konsisten.

**Output QA**: `qa/admin/TAHAP_02_VISUAL_AUDIT.md`, `qa/admin/TAHAP_02_UAT.md`, screenshot desktop/mobile, `docs/ADMIN_TAHAP_02_IMPLEMENTATION.md` yang memuat rute, data/events, keputusan bisnis terbuka, keterbatasan demo, status QA; jalankan typecheck/lint/build/tests yang tersedia dan tulis hasil aktual, bukan klaim generik.

## F. METODE EKSEKUSI DAN LAPORAN AKHIR

Kerjakan berurutan: **audit → Penerimaan & Distribusi → Pengajuan → PO → Mutasi → Integrasi lintas role → QA visual/fungsional → laporan**. Prioritaskan event stock dan shared data source sebelum menyambungkan tombol; jangan membuat UI cantik dengan data yang tidak tersinkron.

Pada akhir pekerjaan, laporkan:
- File/rute yang dibuat atau diubah.
- Demo singkat alur penerimaan → stok → mutasi; pengajuan → antrian Pemilik; PO Kasir → status Admin → Kasir.
- Bukti hasil visual (screenshot path) dan fungsi (UAT pass/fail).
- Apa yang masih pending keputusan: hak status PO `Selesai`, alokasi stok pusat/in-transit, penerimaan selisih, kebijakan persetujuan pengajuan, master produk global/per cabang, aturan fisik stok pesanan PO.
- Instruksi menjalankan website.

**Perintah mulai sekarang**: Periksa repository, baca PRD dan MASTER PROMPT Tahap 01, pastikan modul Tahap 01 aman, lalu IMPLEMENTASIKAN seluruh Tahap 02. Jangan berhenti dengan proposal saja. Jika ada risiko kerusakan atau keputusan bisnis yang benar-benar menghalangi satu fitur, isolasi bagian tersebut sebagai demo/pending dengan label jelas, lalu lanjut kerjakan bagian lain yang aman.
