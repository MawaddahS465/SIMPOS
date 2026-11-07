# MASTER PROMPT OPENCODE — SIMPOS OPTIK MEKAR JAYA
## TAHAP 04 · OWNER/PEMILIK · CHECKPOINT 2
### Pengajuan Kebutuhan Barang → Alokasi Pusat → Distribusi → Penerimaan Cabang → Mutasi

> **MANDAT EKSEKUSI:** Bertindak sebagai Senior Full-Stack Engineer, Inventory Domain Engineer, UI Engineer, dan QA Automation Engineer. Lanjutkan **repository SIMPOS saat ini**. Jangan membuat proyek atau backend kedua. Jangan redesign UI Kasir/Admin/Owner yang sudah disetujui. Implementasikan, jalankan, uji dengan bukti, lalu **BERHENTI untuk review sebelum Checkpoint 3**.

## A. KONDISI YANG TELAH DISETUJUI PENGGUNA

1. Kasir telah selesai menurut pengguna dan harus tetap bekerja.
2. Admin Cabang Tahap 01–02 dan integrasi Tahap 03 dilaporkan telah dibangun.
3. Pada Checkpoint 0–1 Owner, OpenCode melaporkan `test_cross_role.py` **33/33 PASS**, `test_owner_cp1.py` **9/9 PASS**, dan typecheck bersih. Ini **laporan terdahulu, bukan bukti otomatis bahwa kondisi sekarang tetap lulus**. Ulangi tes sebelum dan setelah mengubah kode.
4. Role Owner saat ini memiliki `/owner/login`, Dashboard Owner, Monitoring Cabang, dan Monitoring Stok. Pengguna telah **menyetujui tampilan empat halaman tersebut**. **Kunci UI**: lavender pastel, struktur, sidebar, topbar, typography, spacing, tombol, badges, cards, tabel, serta responsivitas yang ada.
5. Data yang dilaporkan saat CP1: `sharedStore`, `BRANCHES`, `centralStock` (seed/backfill non-destruktif), lokasi Pusat dan Padang; gunakan sumber data nyata di repo. **Jangan mengasumsikan file/variabel itu masih persis sama tanpa audit.**
6. Menu owner Checkpoint 2+ semula disabled "Berikutnya". Aktifkan **hanya** menu CP2 yang diimplementasikan dan lulus.
7. Checkpoint 3 (Monitoring Transaksi, Monitoring PO dan Laporan) serta Checkpoint 4 (integrasi final/deployment) **belum menjadi scope tahap ini**.

## B. SUMBER KEBENARAN

Prioritas: (1) PRD SIMPOS yang tersedia di repo, terutama bagian manajemen stok, distribusi, pengajuan dan hak akses; (2) keputusan pengguna dan approval visual pada CP1; (3) kontrak data, migration, services, tests, dan guard existing; (4) prompt Tahap 04 CP0–1 dan dokumentasi audit.

**Pasti dari PRD:** Admin Cabang mengajukan kebutuhan barang; Pemilik meninjau lalu menentukan jumlah pembagian dari pusat; Admin Cabang mencatat barang fisik diterima; stok cabang diperbarui setelah penerimaan; ada mutasi stok; ada notifikasi pengajuan baru; pembelian dari supplier dan pengiriman ke pelanggan di luar sistem.

**Belum otomatis diputuskan PRD:** kapan tepatnya stok pusat secara akuntansi didebit (alokasi/pengiriman/penerimaan), status pengiriman rinci, mekanisme selisih/kehilangan, pembatalan, penolakan permintaan, pencatatan partial receipt, dan aturan pembayaran/PO selesai. **Jangan menyajikan kebijakan yang belum disetujui sebagai fakta PRD.** Tuliskan sebagai keputusan terbuka dengan rekomendasi teknis yang aman; jangan buat mutasi permanen yang tidak bisa dikoreksi tanpa persetujuan pengguna.

## C. BATASAN IMPLEMENTASI & PENGAMANAN REPO

- Mulai dengan `pwd`, `git status`, identifikasi framework/stack yang dipakai, arsitektur `sharedStore`, routing, model produk, stok pusat, stok cabang, pengajuan, alokasi, penerimaan dan mutasi.
- Baseline: jalankan semua tes yang tersedia (`test_cross_role.py`, `test_owner_cp1.py`, typecheck, build, dsb.). Simpan output nyata di `docs/stage-04/CP2_BASELINE.md`.
- Jika repo dirty, jangan `reset --hard`, jangan replace seluruh file, jangan force push. Gunakan perubahan kecil, aman, serta pencadangan bila mengubah struktur data.
- Jangan mengganti React/CodeIgniter/Supabase/backend apapun yang telah dipilih repo; dokumentasi sumber pernah mencantumkan lebih dari satu stack.
- Jika ada backend, terapkan RBAC dan atomic transaction **di server**. Jika belum ada backend, jujur bahwa `localStorage`/sharedStore hanya DEMO dan tidak menjamin isolasi multi-perangkat atau concurrency nyata. Jangan membuat klaim keamanan atau sinkronisasi multi-device produksi.
- Jaga kompatibilitas data lama: migration/backfill idempotent, versioned dan non-destruktif. Tidak boleh mengganti ID produk/lokasi/PO yang sudah dipakai Kasir.
- Tidak ada admin supplier, pembelian supplier otomatis, pembayaran pelanggan, pengiriman ke pelanggan, CRUD cabang Owner, atau laporan CP3 baru.

## D. TUJUAN CHECKPOINT 2

Buat alur nyata yang berkesinambungan:

**Admin Cabang mengajukan kebutuhan stok → Owner menerima notifikasi dan meninjau → Owner menentukan alokasi qty dari Pusat → sistem mencatat reservasi/distribusi dengan status transparan → Admin tujuan mengonfirmasi penerimaan fisik → stok cabang berubah sekali → Owner/Admin melihat jejak mutasi yang sama.**

Semua peran mengakses **ID entitas yang sama**, bukan data dummy terpisah. Segala jumlah penting harus diperoleh dari sumber data bersama.

## E. MODUL OWNER 1 — PENGAJUAN KEBUTUHAN BARANG

Menu: `Owner > Pengajuan Stok` / nama sepadan dari sidebar yang sudah ada.

Daftar menampilkan minimal `request_id`, waktu/tanggal, nama cabang, jenis `FRAME/LENSA`, produk/SKU, jumlah diminta, stok cabang saat pengajuan atau saat ini (label jelas), batas minimum, status, dan aksi detail/tentukan alokasi. Search/filter status, cabang, produk, dan tanggal sesuai kemampuan existing. Empty/loading/error state mengikuti desain CP1.

Detail: identitas pengaju, cabang, produk, kuantitas, alasan/catatan bila ada, saldo pusat yang tersedia untuk dialokasikan, alokasi terkait, timeline. **Tidak perlu memperlihatkan data resep/pelanggan.**

Ketentuan:
- Pengajuan **dibuat oleh Admin Cabang** untuk cabangnya sendiri, bukan dibuat Owner atas nama cabang.
- Pengajuan baru terlihat pada Owner; notifikasi owner mengikuti mekanisme existing tanpa membuat kanal komunikasi palsu.
- Membuat pengajuan **TIDAK mengubah stok pusat/cabang**.
- Qty diminta bilangan bulat positif, produk eksis/aktif, cabang valid, no duplikasi akibat retry.
- Jika dukungan status pengajuan existing sudah diimplementasikan, gunakan; jangan membuat tombol Tolak/Approve generik hanya karena UI lazim memiliki tombol tersebut.
- Jika qty dipenuhi sebagian, jumlah outstanding dihitung dari data alokasi, tidak melalui pengeditan manual angka di ringkasan.

## F. MODUL OWNER 2 — ALOKASI DAN DISTRIBUSI PUSAT → CABANG

Menu: `Owner > Alokasi Distribusi` atau mengikuti naming existing.

**Membuat alokasi:** pilih pengajuan terkait (atau alokasi manual hanya bila workflow repo/PRD mengizinkan dan diberi alasan), cabang tujuan, SKU, qty alokasi, catatan opsional. Tampilkan qty diminta, belum dipenuhi, saldo pusat fisik, qty ter-reservasi, dan qty bisa dialokasikan dengan label yang berbeda.

**Validasi wajib:** qty integer > 0; cabang tujuan bukan Pusat; lokasi dan SKU valid; qty tidak melebihi outstanding pengajuan (jika berbasis pengajuan) tanpa keputusan eksplisit; qty tidak melebihi `available_to_allocate`; tidak boleh membuat stok negatif; tidak boleh double-allocate dari request sama saat retry; tampilkan kesalahan dengan bahasa Indonesia jelas.

**Status alokasi dan timing stok:** sumber PRD tidak menetapkan momen debit stok Pusat secara rinci. Implementasikan model sementara dengan **pemisahan reservation vs on-hand**, jika arsitektur memungkinkan secara aman:
- `Allocated/Reserved`: alokasi tercatat dan mengurangi **available_to_allocate**, namun bukan penerimaan cabang dan bukan pengurangan fisik `on_hand_pusat`.
- `Dispatched/In Transit`: hanya ketika ada kejadian pengiriman yang benar-benar dicatat oleh pihak berwenang/sudah ada pada workflow. Pada demo yang menyetujui kebijakan ini, pindahkan `on_hand_pusat` → `in_transit` sekali. Jika kewenangan atau momen pengiriman belum disetujui, JANGAN otomatis memproses dispatch; tampilkan alokasi menunggu pengiriman dan catat blocker keputusan bisnis.
- `Received`: Admin tujuan mencatat penerimaan aktual; qty yang diterima menaikkan stok cabang sekali, qty in-transit disesuaikan secara konsisten jika model tersebut dipakai.
- Jika selisih/parsial/kerusakan, catat discrepancy dan jangan diam-diam menganggap semua diterima. Kebijakan penyelesaian selisih memerlukan approval.

**PENTING:** Model reservation/dispatch di atas adalah **rekomendasi teknis untuk prototipe**, bukan keputusan final yang tertulis dalam PRD. Dokumentasikan konfigurasi dan keputusan yang belum disetujui dalam `docs/stage-04/CP2_OPEN_DECISIONS.md`. Jika model existing memakai kebijakan sah yang berbeda, **jangan mengubahnya tanpa audit**; pertahankan invariant dan jelaskan.

**Integrasi Admin:** alokasi Owner harus muncul pada halaman penerimaan/distribusi Admin Cabang tujuan sesuai kontrak existing, tanpa membuat duplikat rekam masuk. Admin hanya dapat mengonfirmasi penerimaan untuk cabangnya; Owner tidak boleh menandai barang fisik sudah diterima atas nama Admin.

**UI:** tampilkan list + detail alokasi, filter status/cabang, status timeline, ringkasan qty dan tombol konfirmasi yang benar-benar wired. Tidak perlu berlebihan KPI atau chart.

## G. MODUL OWNER 3 — MUTASI BARANG / DISTRIBUSI

Menu: `Owner > Riwayat Mutasi` / `Aktivitas Barang` yang sudah direncanakan.

Ledger read-only bagi Owner yang memuat mutasi dari kejadian nyata:
- Penerimaan di cabang (`GOODS_RECEIPT`), pengiriman/transfer dari pusat bila kejadian itu benar terjadi (`TRANSFER_OUT`, `IN_TRANSIT`, `TRANSFER_IN`), penjualan Kasir (`SALE`), dan tipe existing lainnya bila relevan.
- Minimal: `movement_id`, waktu, `reference_id`, SKU, produk, lokasi asal/tujuan jika relevan, signed `delta`, qty, jenis kejadian, aktor, status/keterangan.
- `request created` dan `allocation reserved` adalah **event workflow**, bukan otomatis mutasi fisik; jangan menduplikasi baris movement kuantitas fisik.
- Filter cabang/lokasi, jenis produk, tipe mutasi, rentang tanggal, dan pencarian nomor referensi.
- Satu kejadian bisnis → satu ledger event logis untuk setiap lokasi/sisi yang memang berubah. Gunakan idempotency key / unique constraint / transaction semantics sesuai stack.
- Jangan buat tombol Owner `Edit Saldo`, `Hapus Mutasi`, `Stok Adjustment` jika tidak disetujui PRD.
- Jika perlu rekonstruksi ledger historis dari data lama, jangan menciptakan event yang tidak bisa dibuktikan. Beri penanda `legacy/unverified` atau tampilkan riwayat mulai cutover dengan keterbatasan jelas.

## H. KONTRAK DATA MINIMUM (ADAPTIF TERHADAP REPO)

Pemetaan kontrak yang disarankan, **bukan instruksi untuk menulis skema kedua secara paksa**:

- `StockRequest(id, branch_id, product_id, requested_qty, status, created_by, created_at, note?, version?)`.
- `Allocation(id, request_id?, source_location_id, destination_branch_id, status, created_by, created_at, items[], version?, idempotency_key?)`.
- `AllocationItem(product_id, allocated_qty, received_qty?, dispatched_qty?)`.
- `GoodsReceipt(id, allocation_id, branch_id, received_at, received_by, lines[], idempotency_key?)`.
- `StockBalance(location_id, product_id, on_hand, reserved?, in_transit?)` atau mapping ekuivalen yang konsisten dengan `centralStock` dan stok cabang existing.
- `StockMovement(id, event_type, ref_type, ref_id, location_id, product_id, delta, created_at, created_by)`.

Jaga relasi dan uniqueness agar request, allocation, receipt, mutation saling dapat ditelusuri. **Hindari sinkronisasi ganda** dengan membuat derived selectors untuk totals/notifications/status, bukan menyimpan banyak angka turunan tak konsisten.

Idempotency: submit ganda, refresh/retry, klik cepat, request yang datang dua kali, dan callback dobel harus menghasilkan efek saldo yang sama seperti satu aksi sah.

Atomicity: catat event + ubah stok + update status dalam satu transaksi atomik bila backend tersedia; rollback bila gagal. Untuk sharedStore demo, gunakan satu fungsi domain yang memvalidasi dan commit satu perubahan state immutable secara konsisten, serta beri disclaimer concurrency lintas perangkat belum aman.

## I. ATURAN ROLE DAN CABANG

- **Owner:** baca pengajuan semua cabang, buat/lihat alokasi dari Pusat, baca ledger seluruh lokasi, tanpa hak mencatat penerimaan fisik atau mengubah mutasi manual.
- **Admin Cabang:** membuat/melihat pengajuan dan menerima alokasi **cabang miliknya**; tidak boleh membuat alokasi dari Pusat, mengakses request/receipt cabang lain, atau mengedit saldo Pusat.
- **Kasir:** transaksi/pembayaran/PO sesuai akses; stok berkurang saat penjualan sukses sesuai sistem existing, dan ledger Owner ikut ter-update. Tidak dapat membuat pengajuan/alokasi/penerimaan.
- Owner boleh melihat semua cabang, tetapi data pelanggan dan resep tidak boleh disebarkan ke modul logistik.
- Uji route guard, tombol, handler, dan endpoint backend jika ada; URL manual, payload cabang palsu, dan stale session harus ditolak. UI hidden bukan jaminan otorisasi.

## J. INVARIANTS (WAJIB DIBUKTIKAN DENGAN TEST)

1. Tidak ada saldo negatif pada setiap lokasi/produk.
2. `available_to_allocate = on_hand_pusat - reserved_outstanding` (atau formula model existing yang disetujui), tidak mengabaikan alokasi yang masih ter-reservasi.
3. Alokasi belum diterima **tidak** menaikkan stok cabang.
4. Pengajuan dibuat **tidak** mengubah stok mana pun.
5. Barang diterima menambah stok cabang **satu kali** sebesar qty sah yang diterima.
6. Saldo Pusat berkurang paling banyak satu kali mengikuti peristiwa stok yang diputuskan, **tidak dobel saat dikirim dan diterima**.
7. Pengiriman dan penerimaan tidak menciptakan atau menghilangkan kuantitas tanpa event discrepancy yang tercatat; jika selisih, status masih perlu penyelesaian.
8. Double submit/retry/refresh tidak menggandakan allocation, receipt, atau mutation.
9. Kasir melakukan penjualan sukses → stok cabang berkurang **satu kali** dan Owner melihat mutasi SALE.
10. Status dan kuantitas pengajuan berdasarkan real allocation/receipt, bukan hardcoded.
11. Semua record terikat source/target branch yang benar.
12. Backfill/seed lama tidak membuat stok baru/dobel ketika halaman dimuat ulang.

## K. UI/UX — DESAIN CP1 TELAH DISETUJUI, LOCK

- Gunakan **satu design system lama**. Jangan redesign Login, Dashboard, Monitoring Cabang, Monitoring Stok, fitur Kasir ataupun Admin.
- Menu CP2 baru di sidebar Owner diberi posisi logis setelah Monitoring Stok; aktifkan sesudah benar-benar berfungsi. Menu CP3 tetap disabled/"Berikutnya".
- Layout CP2: page title + deskripsi ringkas, toolbar cari/filter, tabel yang mudah discan, detail drawer/page, aksi alokasi dengan form validasi, badge status, timeline bila relevan.
- Informasi operasional lebih penting daripada dekorasi; **jangan menambah chart, carousel, hero bergambar atau kartu promosi baru**.
- Desktop screenshot 1536×1024; mobile 390×844; tablet 768×1024. Tidak ada overflow viewport; tabel boleh scroll dalam container berlabel.
- Detail action disabled saat loading, confirm dialog untuk aksi stok irreversible, toast sukses hanya setelah state commit.
- Aksesibilitas: label input, keyboard focus, aria bila perlu, contrast, status error jelas.
- Patuhi komponen dan token CSS existing; visual diff pada 4 screen Owner CP1 + dashboard Kasir/Admin agar tidak berubah.

## L. IMPLEMENTASI PER CHECKPOINT (KERJAKAN DALAM URUTAN)

**CP2-A — Audit dan snapshot:** validasi baseline, dokumentasi state/owner approval CP1, pemetaan store/ID, daftar keputusan terbuka.

**CP2-B — Pengajuan terintegrasi:** Owner daftar/detail request dari Admin; notifikasi; query/filter; tanpa perubahan stok akibat pengajuan; unit tests dan evidence.

**CP2-C — Alokasi Owner:** create/view allocation yang aman, reservation, validasi qty, hubungan ke pengajuan, tampil di Admin tujuan; tests invalid qty/oversubscription/double click.

**CP2-D — Distribusi/penerimaan:** sambungkan proses fisik yang **sudah sah di repo**; pisahkan allocation vs receipt dan field `in_transit` bila diterapkan. Jika policy dispatch belum diputuskan, kerjakan safe subflow yang tidak mendebit stok fisik secara ambigu dan tulis blocker eksplisit. Jangan diam-diam membuat approval flow yang belum disetujui.

**CP2-E — Mutasi:** ledger gabungan dari event existing tanpa backfill palsu; filter, detail, trace dari request → allocation → receipt → movement.

**CP2-F — QA & handoff:** suite tests, lint/typecheck/build, desktop/tablet/mobile screenshot, audit regresi CP1/Kasir/Admin, dokumentasi perubahan/risiko.

## M. TESTING WAJIB

Baca `qa/CP2_TEST_MATRIX.md` di paket ini. Buat tes yang executable di repo (Python/JS sesuai stack), termasuk:

- Alur Admin ajukan → Owner alokasikan → Admin terima → saldo berubah benar dan mutasi terbaca.
- Partial allocation, multi-request, stok pusat tidak cukup, qty 0/negatif/desimal, produk tak ada, branch salah, penerimaan lebih dari alokasi, double submit, restart/reload, gagal di tengah transaksi, concurrent allocation (backend).
- Login 3 role, route/API 401/403, forged branch ID, ringkasan owner cross-branch, data pelanggan tidak bocor.
- Kasir penjualan sukses menurunkan stok sekali; tidak merusak PO/pembayaran/struk.
- Visual regression: 4 screen CP1 Owner **tetap sama** dan CP2 baru konsisten; seluruh route mobile tidak overflow.

Jalankan baseline dan post-run; tulis `docs/stage-04/CP2_QA_REPORT.md` berisi **perintah nyata**, pass/fail count, evidence paths, unresolved blockers. **Jangan klaim PASS untuk tes yang tidak dijalankan**.

## N. FILE EVIDENCE DAN DELIVERABLES

Minimal:
- Source code dan migration additive jika relevan.
- `docs/stage-04/CP2_BASELINE.md` (versi sebelumnya + temuan/hasil test awal).
- `docs/stage-04/CP2_IMPLEMENTATION_LOG.md` (file yang diubah, arsitektur dan kontrak data, workflow serta keputusan).
- `docs/stage-04/CP2_OPEN_DECISIONS.md` (timing saldo Pusat, dispatch, partial receipts, selisih, pembatalan, dll. beserta rekomendasi).
- `docs/stage-04/CP2_QA_REPORT.md` (tes nyata dan hasilnya).
- `qa/stage-04/cp2/` screenshots Owner Pengajuan/Alokasi/Mutasi + UI Admin menerima barang (desktop 1536×1024, mobile 390×844); screenshot regresi CP1 Owner; beri nama jelas.
- Semua tombol CP2 yang tampil operasional; loading, error, empty dan konfirmasi benar.
- Ringkasan ke pengguna: apa yang selesai, yang belum disepakati, bukti yang telah diverifikasi dan cara mencoba demo lintas role.

## O. EXIT CRITERIA / STOP RULE

Tahap ini **belum selesai** kalau tidak bisa menunjukkan integrasi antar-role/ledger, jika stok ganda/negatif, jika security bypass, jika fitur Kasir/Admin rusak, jika visual CP1 berubah, atau jika QA belum dijalankan.

Setelah CP2-A hingga CP2-F yang **aman dan disetujui** selesai, **BERHENTI** dan sajikan hasil untuk review pengguna. Jangan mulai **CP3 Monitoring Transaksi/PO/Laporan** atau CP4 tanpa perintah.

**MULAI SEKARANG:** Audit repository aktual, jalankan baseline tests, tulis CP2_BASELINE, lalu implementasi tiap sub-checkpoint secara nyata. Jangan berhenti pada rencana.
