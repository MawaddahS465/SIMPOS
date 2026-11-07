# CP2 — MATRICS QA/UAT LINTAS ROLE

Instruksi: jalankan test otomatis bila mungkin dan uji UI dengan aktor Admin/Owner/Kasir. **PASS hanya jika diperiksa dan ada bukti.** Jangan menganggap nilai numerik di bawah data asli; semua contoh hanya skenario fixture.

| ID | Aktor | Skenario | Ekspektasi | Bukti |
|---|---|---|---|---|
| CP2-01 | Admin A | Pengajuan qty 4 frame | Request baru terdaftar dan muncul di Owner | test+UI |
| CP2-02 | Admin A | Ajukan qty 0, -2, 1.5 | Ditolak, tidak buat request | test |
| CP2-03 | Admin A | Pengajuan valid | Stok pusat/cabang sebelum-sesudah tidak berubah | test |
| CP2-04 | Owner | Lihat daftar pengajuan | Semua cabang terlihat sesuai filter | UI+test |
| CP2-05 | Admin B | Buka request Admin A via URL/ID | Ditolak | API/route test |
| CP2-06 | Owner | Alokasi sebagian qty 2 dari request qty 4 | Remaining qty 2; reservation benar | test+UI |
| CP2-07 | Owner | Alokasi melebihi stok tersedia | Ditolak tanpa perubahan | test |
| CP2-08 | Owner | Dua alokasi bersamaan atas stok terbatas | Tidak oversubscribe, satu ditolak jika perlu | backend concurrency test atau limitation |
| CP2-09 | Owner | Klik Simpan Alokasi ganda | Alokasi tercatat tepat satu kali | test |
| CP2-10 | Admin A | Lihat alokasi cabang A | Muncul, tidak ada milik cabang B | UI+test |
| CP2-11 | Kasir | Buka create allocation | 403/ditolak | auth test |
| CP2-12 | Admin A | Buka create allocation Owner | 403/ditolak | auth test |
| CP2-13 | Owner | Buat alokasi tanpa receipt | Stok cabang belum bertambah | test |
| CP2-14 | Owner | Alokasi reserved | Available-to-allocate berkurang; on-hand fisik belum dibebankan bila kebijakan cadangan dipakai | test |
| CP2-15 | Sistem | Pengiriman sah (bila disetujui) | Stok Pusat terdebit satu kali dan in-transit naik | test/decision |
| CP2-16 | Admin A | Terima qty sah dari alokasi | Stok cabang bertambah hanya sekali; movement tersimpan | test |
| CP2-17 | Admin A | Submit receipt sama dua kali | Tidak ganda; idempotent | test |
| CP2-18 | Admin A | Receipt qty > alokasi / invalid SKU | Ditolak | test |
| CP2-19 | Admin A | Partial receipt | Selisih terekam; status tidak diam-diam selesai penuh | test/decision |
| CP2-20 | Admin B | Terima untuk cabang A dengan forged branch_id | Ditolak | auth test |
| CP2-21 | Owner | Lihat ledger after goods receipt | Entry sesuai event, signed delta, lokasi & referensi akurat | test+UI |
| CP2-22 | Owner | Buat request/alokasi tapi belum ada mutasi fisik | Tidak ada movement fisik palsu | test |
| CP2-23 | Kasir A | Penjualan sukses SKU X | Stok cabang A turun sekali, movement SALE muncul | regression test |
| CP2-24 | Kasir A | Duplicate payment callback/submit | Stok tidak turun dua kali | regression test |
| CP2-25 | Semua | Reload, migrasi/backfill ulang | ID dan saldo lama terjaga; no duplicate | test |
| CP2-26 | Semua | Error di tengah write | Tidak ada status/ledger/stock tersimpan sebagian | test |
| CP2-27 | Owner | Filter mutasi produk/cabang/periode | Hasil benar dan filter dapat direset | UI+test |
| CP2-28 | Owner | Owner lama CP1 Dashboard/Cabang/Stok | Screenshot/design/aksi tidak berubah | visual+regression |
| CP2-29 | Semua | Desktop 1536x1024, tablet 768x1024, mobile 390x844 | No viewport overflow, sidebar/drawer benar | screenshots |
| CP2-30 | Semua | Login/logout/route guard | Role tepat, forbidden route tertolak setelah logout | test |
| CP2-31 | Owner | Dashboard pengajuan terbaru | Count berasal dari request nyata, update setelah aksi | test |
| CP2-32 | Owner | Tinjau lokasi Pusat dan Padang | Data masing-masing benar; Pusat bukan cabang penjualan | test |
| CP2-33 | Semua | Data customer dan resep dalam modul logistik | Tidak ditampilkan/dibocorkan | review+test |
| CP2-34 | Developer | `test_cross_role.py`, `test_owner_cp1.py`, build/typecheck | Seluruh baseline tetap lulus (atau jelaskan kegagalan riil) | commands+logs |

## Laporan

Tulis `CP2_QA_REPORT.md` dengan kolom ID, status PASS/FAIL/BLOCKED/NOT RUN, test command, screenshot/log, catatan bug dan penanganan. Jika kebijakan dispatch/selisih belum disetujui, tandai pengujian tergantung kebijakan sebagai BLOCKED, jangan PASS palsu.
