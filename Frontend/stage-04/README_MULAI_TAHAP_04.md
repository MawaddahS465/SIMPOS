# SIMPOS Optik Mekar Jaya — Tahap 04: Pemilik

## Tujuan
Menambah role Pemilik di **repository SIMPOS yang sama** dengan Kasir dan Admin Cabang, bukan membuat project baru. Dashboard dan data Owner menggunakan sumber data yang dipakai dua role tersebut.

## Isi folder
- `MASTER_PROMPT_OPENCODE_PEMILIK_TAHAP_04.md` — instruksi OpenCode utama.
- `docs/PRD_SIMPOS_Optik_Mekar_Jaya_Pemilik.pdf` — PRD Owner yang pernah dibuat.
- `references/01-dashboard-kasir-design-system.png` — gambar yang telah disetujui, khusus acuan visual konsistensi.
- `references/02-login-design-system.png` — gambar gaya login, bukan perintah membuat login terpisah.
- `docs/OWNER_FEATURE_MAP.md` — pemetaan layar dan fitur ke PRD.
- `docs/OPEN_BUSINESS_DECISIONS.md` — isu keputusan bisnis yang masih belum final.
- `qa/REFERENCE_TEST_MATRIX.md` — daftar test wajib minimal.

## Setup
1. Cadangkan atau commit pekerjaan Tahap 03; pastikan working tree aman.
2. Ekstrak ZIP ini di **root project yang berisi aplikasi Kasir/Admin**, sehingga terbentuk folder `stage-04`.
3. Buka terminal di root repository, jalankan `opencode`.
4. Gunakan prompt singkat: `Baca stage-04/MASTER_PROMPT_OPENCODE_PEMILIK_TAHAP_04.md dan jalankan checkpoint 0–1 pada repository ini. Jangan buat project baru, jangan mengubah visual Kasir/Admin, berikan screenshot dan audit hasil sebelum melanjutkan. Semua tindakan destruktif/migrasi besar harus meminta persetujuan.`
5. Review screenshot Owner setelah Checkpoint 1. Baru kemudian lanjutkan checkpoint 2, 3, 4.

## Kewaspadaan
- Jangan menyimpulkan Tahap 03 selesai hanya dari cerita; verifikasi kode dan pengujian.
- Repo frontend lokal hanya memungkinkan simulasi; integrasi real-time antar pengguna memerlukan backend otoritatif.
- Status approval pengajuan, waktu pengurangan stok pusat, dan penanggung jawab akhir PO belum final dari dokumen sumber.
- Pemilik hanya monitoring + alokasi. Tidak diberi akses CRUD master cabang, penjualan, atau edit pembayaran tanpa keputusan bisnis baru.

## Urutan target
- Checkpoint 0: audit repo dan source-of-truth.
- Checkpoint 1: login/dashboard/monitoring cabang/stok + review visual.
- Checkpoint 2: pengajuan/alokasi/mutasi.
- Checkpoint 3: transaksi/PO/laporan ekspor.
- Checkpoint 4: E2E 3 role dan regresi.
