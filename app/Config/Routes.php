<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */

// Halaman utama langsung menampilkan login.
$routes->get('/', 'Auth::login');

// Satu halaman login untuk semua peran.
$routes->get('login', 'Auth::login');
$routes->post('login', 'Auth::prosesLogin');

// Arahkan URL login lama ke halaman bersama.
$routes->get('admin/login', static fn () => redirect()->to('/login'));
$routes->get('owner/login', static fn () => redirect()->to('/login'));
$routes->post('admin/login', 'Auth::prosesLogin');
$routes->post('owner/login', 'Auth::prosesLogin');

// Logout
$routes->post('logout', 'Auth::logout');

// Dashboard hanya untuk pengguna yang sudah login.
$routes->get('dashboard', 'Dashboard::index', [
    'filter' => 'auth',
]);

// Area Kasir.
$routes->group('kasir', ['filter' => ['auth', 'role:kasir']], static function ($routes): void {
    $routes->get('dashboard', 'Kasir\Dashboard::index');

    $routes->get('transaksi', 'Kasir\Transaksi::index');
    $routes->post('transaksi/tambah', 'Kasir\Transaksi::tambah');
    $routes->post('transaksi/qty', 'Kasir\Transaksi::ubahQty');
    $routes->post('transaksi/hapus', 'Kasir\Transaksi::hapus');
    $routes->get('checkout', 'Kasir\Transaksi::checkout');
    $routes->post('checkout/pelanggan', 'Kasir\Transaksi::pilihPelanggan');
    $routes->post('checkout/selesai', 'Kasir\Transaksi::selesaikan');
    $routes->get('transaksi/berhasil/(:num)', 'Kasir\Transaksi::berhasil/$1');

    $routes->get('pemesanan', 'Kasir\Pemesanan::index');
    $routes->get('notifikasi', 'Kasir\Pemesanan::notifikasi');
    $routes->post('pemesanan', 'Kasir\Pemesanan::simpan');
    $routes->get('pemesanan/(:num)/pengambilan', 'Kasir\Pemesanan::pengambilan/$1');
    $routes->post('pemesanan/(:num)/pengambilan', 'Kasir\Pemesanan::selesaikanPengambilan/$1');
    $routes->get('pemesanan/(:num)', 'Kasir\Pemesanan::detail/$1');

    $routes->get('riwayat', 'Kasir\Riwayat::index');
    $routes->get('riwayat/(:num)', 'Kasir\Riwayat::detail/$1');

    $routes->get('pelanggan', 'Kasir\Pelanggan::index');
    $routes->post('pelanggan', 'Kasir\Pelanggan::simpan');
    $routes->post('pelanggan/ubah', 'Kasir\Pelanggan::ubah');

    $routes->get('resep', 'Kasir\Resep::index');
    $routes->post('resep', 'Kasir\Resep::simpan');

    $routes->get('pembayaran', 'Kasir\Pembayaran::index');
});

// Master data: hanya admin dan pemilik.
$routes->group('kategori', ['filter' => ['auth', 'role:admin,pemilik']], static function ($routes): void {
    $routes->get('/', 'Master\Kategori::index');
    $routes->get('baru', 'Master\Kategori::create');
    $routes->post('/', 'Master\Kategori::store');
    $routes->get('(:num)/edit', 'Master\Kategori::edit/$1');
    $routes->post('(:num)', 'Master\Kategori::update/$1');
    $routes->post('(:num)/hapus', 'Master\Kategori::delete/$1');
});
