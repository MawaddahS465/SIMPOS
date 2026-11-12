<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */

// API autentikasi menggunakan session CI4 dan perlindungan CSRF.
$routes->group('api', [
    'namespace' => 'App\Controllers\Api',
    'filter'    => 'api-csrf',
], static function ($routes): void {
    $routes->post('login', 'AuthApi::login');
    $routes->get('me', 'AuthApi::me');
    $routes->post('logout', 'AuthApi::logout');

    $routes->group('kasir', ['filter' => 'api-role:kasir'], static function ($routes): void {
        $routes->get('katalog', 'KasirApi::catalog');

        $routes->get('pelanggan', 'KasirApi::customers');
        $routes->post('pelanggan', 'KasirApi::createCustomer');
        $routes->post('pelanggan/(:num)', 'KasirApi::updateCustomer/$1');

        $routes->get('resep', 'KasirApi::recipes');
        $routes->post('resep', 'KasirApi::createRecipe');
        $routes->post('resep/(:num)', 'KasirApi::updateRecipe/$1');

        $routes->get('keranjang', 'KasirApi::cart');
        $routes->post('keranjang/item', 'KasirApi::setCartItem');
        $routes->post('keranjang/pelanggan', 'KasirApi::selectCartCustomer');
        $routes->post('keranjang/kosongkan', 'KasirApi::clearCart');
        $routes->post('checkout', 'KasirApi::checkout');

        $routes->get('transaksi', 'KasirApi::transactions');
        $routes->get('transaksi/(:num)', 'KasirApi::transaction/$1');

        $routes->get('pemesanan', 'KasirApi::orders');
        $routes->post('pemesanan', 'KasirApi::createOrder');
        $routes->get('pemesanan/(:num)', 'KasirApi::order/$1');
        $routes->post('pemesanan/(:num)/pengambilan', 'KasirApi::completeOrder/$1');

        $routes->get('pembayaran', 'KasirApi::payments');
    });

    $routes->group('admin', ['filter' => 'api-role:admin'], static function ($routes): void {
        $routes->get('notifikasi', 'AdminNotificationApi::index');
        $routes->get('dashboard', 'AdminDashboardApi::summary');
        $routes->get('produk', 'AdminInventoryApi::products');
        $routes->post('produk', 'AdminInventoryApi::createProduct');
        $routes->post('produk/(:num)', 'AdminInventoryApi::updateProduct/$1');
        $routes->post('produk/(:num)/nonaktifkan', 'AdminInventoryApi::deactivateProduct/$1');
$routes->post('produk/(:num)/aktifkan', 'AdminInventoryApi::activateProduct/$1');
        $routes->get('stok', 'AdminInventoryApi::stocks');
        $routes->post('stok/(:num)/minimum', 'AdminInventoryApi::updateMinimum/$1');
        $routes->get('pengajuan-stok', 'AdminStockFlowApi::requests');
        $routes->post('pengajuan-stok', 'AdminStockFlowApi::createRequest');
        $routes->get('distribusi-stok', 'AdminStockFlowApi::distributions');
        $routes->post('penerimaan-stok', 'AdminStockFlowApi::receive');
        $routes->get('mutasi-stok', 'AdminStockFlowApi::mutations');
        $routes->get('pemesanan', 'AdminPoApi::orders');
        $routes->get('pemesanan/(:num)', 'AdminPoApi::order/$1');
        $routes->post('pemesanan/(:num)/status', 'AdminPoApi::updateStatus/$1');
    });

    $routes->group('owner', ['filter' => 'api-role:pemilik'], static function ($routes): void {
        $routes->get('cabang', 'OwnerManagementApi::branches');
        $routes->post('cabang', 'OwnerManagementApi::upsertBranch');
        $routes->post('cabang/(:num)', 'OwnerManagementApi::upsertBranch/$1');
        $routes->get('stok', 'OwnerManagementApi::stocks');
        $routes->get('mutasi-stok', 'OwnerManagementApi::mutations');
        $routes->get('penerimaan-stok', 'OwnerManagementApi::receipts');
        $routes->get('transaksi', 'OwnerManagementApi::transactions');
        $routes->get('pemesanan', 'OwnerManagementApi::orders');
        $routes->get('pengguna', 'OwnerManagementApi::users');
        $routes->post('pengguna', 'OwnerManagementApi::saveUser');
        $routes->post('pengguna/(:num)', 'OwnerManagementApi::saveUser/$1');
        $routes->post('pengguna/(:num)/status', 'OwnerManagementApi::userStatus/$1');
        $routes->get('pengaturan', 'OwnerManagementApi::settings');
        $routes->post('pengaturan', 'OwnerManagementApi::saveSettings');
        $routes->post('pengaturan/password', 'OwnerManagementApi::changePassword');
        $routes->get('pengajuan-stok', 'OwnerStockFlowApi::requests');
        $routes->post('pengajuan-stok/(:num)/tolak', 'OwnerStockFlowApi::rejectRequest/$1');
        $routes->get('alokasi-stok/opsi', 'OwnerStockFlowApi::allocationOptions');
        $routes->get('alokasi-stok', 'OwnerStockFlowApi::allocations');
        $routes->post('alokasi-stok', 'OwnerStockFlowApi::createAllocation');
    });
});

// Backend hanya menyediakan API dan frontend React hasil build.
// Build Vite memakai base /app/, sehingga alias /login diarahkan ke /app/login.
// Redirect memakai Location relatif agar tetap benar saat diakses lewat tunnel.
$appLoginRedirect = static fn () => service('response')
    ->setStatusCode(302)
    ->setHeader('Location', '/app/login');

$routes->get('/', $appLoginRedirect);
$routes->get('login', $appLoginRedirect);
$routes->get('app/login', 'Spa::index');
$routes->get('admin/login', $appLoginRedirect);
$routes->get('owner/login', $appLoginRedirect);
$routes->get('app/admin/login', $appLoginRedirect);
$routes->get('app/owner/login', $appLoginRedirect);

// Aplikasi React: wajib login.
$routes->group('app', ['filter' => 'auth'], static function ($routes): void {
    $routes->get('/', 'Spa::index');
    $routes->get('(:any)', 'Spa::index');
});
