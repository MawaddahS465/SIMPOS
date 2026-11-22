# 13 — Addendum Scope Pemilik v1.1

Tanggal: 22 Nov 2026
Dasar: keputusan pemilik usaha atas Decision Register #13 (sebelumnya `NO_PRD_POLICY`).
Status: **APPROVED** untuk O11 dan O12.

## Keputusan

Pemilik mengelola **akun pengguna** dan **master cabang** dari aplikasi, bukan lewat
edit database manual.

## Halaman baru di luar PRD v1.0

| Kode | Halaman | Rute | Hak |
|---|---|---|---|
| O11 | Manajemen Pengguna | `/owner/pengguna` | Tambah, ubah, aktif/nonaktifkan akun; reset password staf |
| O12 | Manajemen Cabang | `/owner/cabang` | Tambah, ubah, aktif/nonaktifkan cabang |

O12 memperluas O03. Tampilan detail cabang tetap read-only dan tetap menampilkan
daftar akun yang bertugas di lokasi tersebut.

## Pembatas yang wajib berlaku

1. **Tanpa hard delete.** Akun dan cabang hanya dapat dinonaktifkan agar histori
   transaksi, PO, dan mutasi tetap utuh.
2. **Role akun sendiri tidak dapat diturunkan.** Mencegah Owner mengunci dirinya
   dari route Pemilik.
3. **Minimal satu Pemilik aktif.** Role Pemilik terakhir tidak dapat diturunkan atau
   dinonaktifkan.
4. **Akun sendiri tidak dapat dinonaktifkan** dari sesi yang sedang dipakai.
5. **Password tidak pernah ditampilkan atau disimpan plaintext.** Hash dilakukan di
   `UserModel`; minimal 8 karakter.
6. **Perubahan akun dan status dicatat** di log aplikasi (aktor, target, aksi).
7. **Kasir/Admin wajib terikat cabang aktif.**
8. **Field pengaturan toko dan edit profil dihapus.** `OwnerPengaturanPage` tidak
   lagi menjadi halaman; ubah kata sandi sendiri dipindah ke menu profil di topbar.

## Tetap di luar scope Pemilik

- Tombol Setujui/Tolak pengajuan (Decision #5/#6).
- Mengubah status atau pembayaran PO.
- Input transaksi, pembayaran, atau resep.
- Laba, margin, HPP (Decision #12).
- Refund/DP/parsial (Decision #11).

## Perubahan implementasi

| Area | Perubahan |
|---|---|
| Sidebar Owner | Grup `PENGATURAN` → `AKSES`, menu `Pengguna` |
| `OwnerPenggunaPage` | Baru: daftar, filter, tambah/ubah akun, aktif/nonaktif |
| `OwnerLayout` | Menu profil topbar: Ubah Kata Sandi (self-service) dan Keluar |
| `OwnerCabangPage` | Tab akun dihapus; tambah/ubah cabang tetap; akun hanya tampil read-only di detail |
| `OwnerPengaturanPage` | Dihapus |
| `OwnerManagementApi::saveUser` | Guard role sendiri dan Pemilik terakhir; log audit |
| `OwnerManagementApi::userStatus` | Log audit |

## Kriteria terima

- Menu Owner menampilkan `Pengguna`; tidak ada menu `Pengaturan`.
- Akun baru dapat dibuat untuk Kasir/Admin dengan cabang wajib, dan Pemilik tanpa cabang.
- Akun dapat dinonaktifkan lalu diaktifkan kembali; tidak ada tombol hapus permanen.
- Owner tidak dapat menurunkan role akunnya sendiri (HTTP 409).
- Owner tidak dapat menurunkan/menonaktifkan Pemilik aktif terakhir (HTTP 409).
- Cabang baru dapat ditambahkan lalu muncul di monitoring, alokasi, dan laporan.
- Semua halaman tetap API-driven; tidak memakai data demo/localStorage.
