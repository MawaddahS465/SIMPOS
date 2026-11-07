-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 21 Okt 2026 pada 15.39
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dbsimpos`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `barang`
--

CREATE TABLE `barang` (
  `id` int(11) UNSIGNED NOT NULL,
  `kategori_id` int(11) UNSIGNED NOT NULL,
  `kode_barang` varchar(30) NOT NULL,
  `nama_barang` varchar(150) NOT NULL,
  `jenis` varchar(20) NOT NULL,
  `merek` varchar(100) DEFAULT NULL,
  `harga_jual` decimal(12,2) UNSIGNED NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'aktif',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `cabang`
--

CREATE TABLE `cabang` (
  `id` int(5) UNSIGNED NOT NULL,
  `kode_cabang` varchar(10) NOT NULL,
  `nama_cabang` varchar(100) NOT NULL,
  `alamat` text DEFAULT NULL,
  `telepon` varchar(20) DEFAULT NULL,
  `status` enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `cabang`
--

INSERT INTO `cabang` (`id`, `kode_cabang`, `nama_cabang`, `alamat`, `telepon`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(8, 'CB001', 'Pasar Raya 1', 'Pasar Raya', '', 'aktif', NULL, NULL, NULL),
(9, 'CB002', 'Pasar Raya 2', 'Pasar Raya', '', 'aktif', NULL, NULL, NULL),
(10, 'CB003', 'Pasar Raya 3', 'Pasar Raya', '', 'aktif', NULL, NULL, NULL),
(11, 'CB004', 'Pasar Raya 4', 'Pasar Raya', '', 'aktif', NULL, NULL, NULL),
(12, 'CB005', 'Pasar Raya 5', 'Pasar Raya', '', 'aktif', NULL, NULL, NULL),
(13, 'CB006', 'Bandar Buat', 'Bandar Buat', '', 'aktif', NULL, NULL, NULL),
(14, 'CB007', 'Payakumbuh', 'Payakumbuh', '', 'aktif', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `detail_po`
--

CREATE TABLE `detail_po` (
  `id_detail_po` int(11) UNSIGNED NOT NULL,
  `po_id` int(11) UNSIGNED NOT NULL,
  `barang_id` int(11) UNSIGNED NOT NULL,
  `jumlah` int(11) UNSIGNED NOT NULL DEFAULT 1,
  `harga` decimal(12,2) UNSIGNED NOT NULL DEFAULT 0.00,
  `subtotal` decimal(12,2) UNSIGNED NOT NULL DEFAULT 0.00,
  `catatan` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `detail_transaksi`
--

CREATE TABLE `detail_transaksi` (
  `id_detail_transaksi` int(11) UNSIGNED NOT NULL,
  `transaksi_id` int(11) UNSIGNED NOT NULL,
  `barang_id` int(11) UNSIGNED NOT NULL,
  `jumlah` int(11) UNSIGNED NOT NULL DEFAULT 1,
  `harga` decimal(12,2) UNSIGNED NOT NULL,
  `subtotal` decimal(12,2) UNSIGNED NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `kategori_barang`
--

CREATE TABLE `kategori_barang` (
  `id` int(11) UNSIGNED NOT NULL,
  `kode_kategori` varchar(20) NOT NULL,
  `nama_kategori` varchar(100) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'aktif',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `migrations`
--

CREATE TABLE `migrations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `version` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `group` varchar(255) NOT NULL,
  `namespace` varchar(255) NOT NULL,
  `time` int(11) NOT NULL,
  `batch` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `migrations`
--

INSERT INTO `migrations` (`id`, `version`, `class`, `group`, `namespace`, `time`, `batch`) VALUES
(1, '2026-10-13-071243', 'App\\Database\\Migrations\\CreateCabangTable', 'default', 'App', 1792364468, 1),
(2, '2026-10-13-071945', 'App\\Database\\Migrations\\CreateUsersTable', 'default', 'App', 1792364468, 1),
(3, '2026-10-20-131711', 'App\\Database\\Migrations\\CreateKategoriBarangTable', 'default', 'App', 1792502275, 2),
(4, '2026-10-20-131828', 'App\\Database\\Migrations\\CreateBarangTable', 'default', 'App', 1792502425, 3),
(5, '2026-10-20-132537', 'App\\Database\\Migrations\\CreateStokCabangTable', 'default', 'App', 1792502799, 4),
(6, '2026-10-21-110515', 'App\\Database\\Migrations\\CreatePelangganTable', 'default', 'App', 1792580887, 5),
(7, '2026-10-21-110625', 'App\\Database\\Migrations\\CreateResepTable', 'default', 'App', 1792580887, 5),
(8, '2026-10-21-111125', 'App\\Database\\Migrations\\CreateTransaksiTable', 'default', 'App', 1792581124, 6),
(9, '2026-10-21-111516', 'App\\Database\\Migrations\\CreateDetailTransaksiTable', 'default', 'App', 1792581384, 7),
(10, '2026-10-21-111739', 'App\\Database\\Migrations\\CreatePembayaranTable', 'default', 'App', 1792581494, 8),
(11, '2026-10-21-111920', 'App\\Database\\Migrations\\CreatePemesananPoTable', 'default', 'App', 1792581592, 9),
(12, '2026-10-21-112017', 'App\\Database\\Migrations\\CreateDetailPoTable', 'default', 'App', 1792581644, 10);

-- --------------------------------------------------------

--
-- Struktur dari tabel `pelanggan`
--

CREATE TABLE `pelanggan` (
  `id_pelanggan` int(11) UNSIGNED NOT NULL,
  `nama_pelanggan` varchar(100) NOT NULL,
  `alamat` text DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id_pembayaran` int(11) UNSIGNED NOT NULL,
  `transaksi_id` int(11) UNSIGNED NOT NULL,
  `tanggal_pembayaran` datetime NOT NULL,
  `metode_pembayaran` varchar(30) NOT NULL,
  `jumlah_bayar` decimal(12,2) UNSIGNED NOT NULL,
  `referensi` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'berhasil',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `pemesanan_po`
--

CREATE TABLE `pemesanan_po` (
  `id_po` int(11) UNSIGNED NOT NULL,
  `kode_po` varchar(30) NOT NULL,
  `pelanggan_id` int(11) UNSIGNED NOT NULL,
  `cabang_id` int(11) UNSIGNED NOT NULL,
  `pengguna_id` int(11) UNSIGNED NOT NULL,
  `resep_id` int(11) UNSIGNED DEFAULT NULL,
  `tanggal_po` datetime NOT NULL,
  `tanggal_estimasi_selesai` date DEFAULT NULL,
  `total` decimal(12,2) UNSIGNED NOT NULL DEFAULT 0.00,
  `status` varchar(30) NOT NULL DEFAULT 'menunggu',
  `catatan` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `resep`
--

CREATE TABLE `resep` (
  `id_resep` int(11) UNSIGNED NOT NULL,
  `fk_id_pelanggan` int(11) UNSIGNED NOT NULL,
  `tanggal_resep` date NOT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `stok_cabang`
--

CREATE TABLE `stok_cabang` (
  `id` int(11) UNSIGNED NOT NULL,
  `cabang_id` int(5) UNSIGNED NOT NULL,
  `barang_id` int(11) UNSIGNED NOT NULL,
  `jumlah_stok` int(11) UNSIGNED NOT NULL DEFAULT 0,
  `stok_minimum` int(11) UNSIGNED NOT NULL DEFAULT 5,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `transaksi`
--

CREATE TABLE `transaksi` (
  `id_transaksi` int(11) UNSIGNED NOT NULL,
  `pelanggan_id` int(11) UNSIGNED DEFAULT NULL,
  `cabang_id` int(11) UNSIGNED NOT NULL,
  `pengguna_id` int(11) UNSIGNED NOT NULL,
  `tanggal_transaksi` datetime NOT NULL,
  `total` decimal(12,2) UNSIGNED NOT NULL DEFAULT 0.00,
  `status` varchar(20) NOT NULL DEFAULT 'selesai',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(5) UNSIGNED NOT NULL,
  `nama` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('pemilik','admin','kasir') NOT NULL DEFAULT 'kasir',
  `cabang_id` int(5) UNSIGNED DEFAULT NULL,
  `status` enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `nama`, `username`, `password`, `role`, `cabang_id`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Pemilik Optik', 'pemilik', '$2y$10$dqlv0u9C5iFkeEyUgGr2MOxsvzUir7qs0up68Ay2Onf2E0HzFd1X.', 'pemilik', NULL, 'aktif', '2026-10-20 14:08:21', '2026-10-21 12:45:46', NULL),
(5, 'Kasir ', 'kasir1', '$2y$10$2VVAykao4r2UYrt.0aVeB.r5STImcB/45fY1uvKZAvKgQSwVwoE0W', 'kasir', 8, 'aktif', '2026-10-20 14:35:35', '2026-10-21 12:46:45', NULL),
(7, 'Admin Cabang ', 'admin1', '$2y$10$Spzi7YVHEHjqjkYK6dOlU.VZ1Pal1Pj8BD8a3dFwnWlKxh9.vxBPK', 'admin', 8, 'aktif', '2026-10-20 14:41:11', '2026-10-21 12:46:57', NULL);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `barang`
--
ALTER TABLE `barang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_barang` (`kode_barang`),
  ADD KEY `kategori_id` (`kategori_id`);

--
-- Indeks untuk tabel `cabang`
--
ALTER TABLE `cabang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_cabang` (`kode_cabang`);

--
-- Indeks untuk tabel `detail_po`
--
ALTER TABLE `detail_po`
  ADD PRIMARY KEY (`id_detail_po`),
  ADD KEY `po_id` (`po_id`),
  ADD KEY `barang_id` (`barang_id`);

--
-- Indeks untuk tabel `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  ADD PRIMARY KEY (`id_detail_transaksi`),
  ADD KEY `transaksi_id` (`transaksi_id`),
  ADD KEY `barang_id` (`barang_id`);

--
-- Indeks untuk tabel `kategori_barang`
--
ALTER TABLE `kategori_barang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_kategori` (`kode_kategori`);

--
-- Indeks untuk tabel `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`id_pelanggan`);

--
-- Indeks untuk tabel `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id_pembayaran`),
  ADD KEY `transaksi_id` (`transaksi_id`);

--
-- Indeks untuk tabel `pemesanan_po`
--
ALTER TABLE `pemesanan_po`
  ADD PRIMARY KEY (`id_po`),
  ADD UNIQUE KEY `kode_po` (`kode_po`),
  ADD KEY `pelanggan_id` (`pelanggan_id`),
  ADD KEY `cabang_id` (`cabang_id`),
  ADD KEY `pengguna_id` (`pengguna_id`),
  ADD KEY `resep_id` (`resep_id`);

--
-- Indeks untuk tabel `resep`
--
ALTER TABLE `resep`
  ADD PRIMARY KEY (`id_resep`),
  ADD KEY `fk_id_pelanggan` (`fk_id_pelanggan`);

--
-- Indeks untuk tabel `stok_cabang`
--
ALTER TABLE `stok_cabang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cabang_id_barang_id` (`cabang_id`,`barang_id`),
  ADD KEY `stok_cabang_barang_id_foreign` (`barang_id`);

--
-- Indeks untuk tabel `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`id_transaksi`),
  ADD KEY `pelanggan_id` (`pelanggan_id`),
  ADD KEY `cabang_id` (`cabang_id`),
  ADD KEY `pengguna_id` (`pengguna_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `users_cabang_id_foreign` (`cabang_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `barang`
--
ALTER TABLE `barang`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `cabang`
--
ALTER TABLE `cabang`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `detail_po`
--
ALTER TABLE `detail_po`
  MODIFY `id_detail_po` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  MODIFY `id_detail_transaksi` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `kategori_barang`
--
ALTER TABLE `kategori_barang`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT untuk tabel `pelanggan`
--
ALTER TABLE `pelanggan`
  MODIFY `id_pelanggan` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id_pembayaran` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `pemesanan_po`
--
ALTER TABLE `pemesanan_po`
  MODIFY `id_po` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `resep`
--
ALTER TABLE `resep`
  MODIFY `id_resep` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `stok_cabang`
--
ALTER TABLE `stok_cabang`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id_transaksi` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `barang`
--
ALTER TABLE `barang`
  ADD CONSTRAINT `barang_kategori_id_foreign` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_barang` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `detail_po`
--
ALTER TABLE `detail_po`
  ADD CONSTRAINT `detail_po_barang_id_foreign` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_po_po_id_foreign` FOREIGN KEY (`po_id`) REFERENCES `pemesanan_po` (`id_po`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  ADD CONSTRAINT `detail_transaksi_barang_id_foreign` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_transaksi_transaksi_id_foreign` FOREIGN KEY (`transaksi_id`) REFERENCES `transaksi` (`id_transaksi`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `pembayaran_transaksi_id_foreign` FOREIGN KEY (`transaksi_id`) REFERENCES `transaksi` (`id_transaksi`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pemesanan_po`
--
ALTER TABLE `pemesanan_po`
  ADD CONSTRAINT `pemesanan_po_cabang_id_foreign` FOREIGN KEY (`cabang_id`) REFERENCES `cabang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pemesanan_po_pelanggan_id_foreign` FOREIGN KEY (`pelanggan_id`) REFERENCES `pelanggan` (`id_pelanggan`) ON DELETE CASCADE,
  ADD CONSTRAINT `pemesanan_po_pengguna_id_foreign` FOREIGN KEY (`pengguna_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pemesanan_po_resep_id_foreign` FOREIGN KEY (`resep_id`) REFERENCES `resep` (`id_resep`) ON DELETE CASCADE ON UPDATE SET NULL;

--
-- Ketidakleluasaan untuk tabel `resep`
--
ALTER TABLE `resep`
  ADD CONSTRAINT `resep_fk_id_pelanggan_foreign` FOREIGN KEY (`fk_id_pelanggan`) REFERENCES `pelanggan` (`id_pelanggan`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `stok_cabang`
--
ALTER TABLE `stok_cabang`
  ADD CONSTRAINT `stok_cabang_barang_id_foreign` FOREIGN KEY (`barang_id`) REFERENCES `barang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stok_cabang_cabang_id_foreign` FOREIGN KEY (`cabang_id`) REFERENCES `cabang` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `transaksi_cabang_id_foreign` FOREIGN KEY (`cabang_id`) REFERENCES `cabang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaksi_pelanggan_id_foreign` FOREIGN KEY (`pelanggan_id`) REFERENCES `pelanggan` (`id_pelanggan`) ON DELETE CASCADE ON UPDATE SET NULL,
  ADD CONSTRAINT `transaksi_pengguna_id_foreign` FOREIGN KEY (`pengguna_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_cabang_id_foreign` FOREIGN KEY (`cabang_id`) REFERENCES `cabang` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
